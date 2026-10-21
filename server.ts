import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.data');
const STATE_FILE = path.join(DATA_DIR, 'choco-state.json');
const TMP_BACKUP_FILE = '/tmp/choco-state-backup.json';
const CHARACTERS_TS_FILE = path.join(__dirname, 'src', 'data', 'characters.ts');
const DATING_IDEAS_TS_FILE = path.join(__dirname, 'src', 'data', 'datingIdeas.ts');
const MULTIVERSE_TS_FILE = path.join(__dirname, 'src', 'data', 'multiverse.ts');
const PERSISTED_DEFAULTS_TS_FILE = path.join(__dirname, 'src', 'data', 'persistedDefaults.ts');

interface CharacterRecord {
  id: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

interface IdRecord {
  id?: string;
  date?: string;
  character?: string;
  quote?: string;
  [key: string]: unknown;
}

interface PersistedWebState {
  updatedAt: number;
  customCharacters?: CharacterRecord[];
  deletedCharacterIds?: string[];
  favoriteIds?: string[];
  houseFavoriteRaw?: string | null;
  shows?: IdRecord[];
  openWorlds?: IdRecord[];
  savedCommands?: IdRecord[];
  datingIdeas?: IdRecord[];
  memories?: IdRecord[];
  vibeOverrides?: Record<string, string>;
  activeVibe?: string;
}

function normalizeServerCharacterRecord(item: CharacterRecord): CharacterRecord {
  if (!item || typeof item !== 'object') return item;

  if (item.id === 'char-luc-thua-da') {
    if (item.createdAt !== undefined) {
      const { createdAt, ...rest } = item;
      const updated = Math.max(
        typeof item.updatedAt === 'number' ? item.updatedAt : 0,
        typeof createdAt === 'number' ? createdAt : 0
      );
      return {
        ...rest,
        ...(updated > 0 ? { updatedAt: updated } : {}),
      };
    }
    return item;
  }

  if (typeof item.id === 'string' && item.id.startsWith('char-custom-')) {
    const rawTs = Number(item.id.slice('char-custom-'.length));
    if (Number.isFinite(rawTs) && rawTs > 0) {
      if (typeof item.createdAt === 'number' && item.createdAt > rawTs + 5000) {
        return {
          ...item,
          createdAt: rawTs,
          updatedAt: Math.max(typeof item.updatedAt === 'number' ? item.updatedAt : 0, item.createdAt),
        };
      }
      if (item.createdAt === undefined) {
        return {
          ...item,
          createdAt: rawTs,
        };
      }
    }
  }

  return item;
}

function mergeCharacterRecords(
  existingList: unknown[],
  incomingList: unknown[],
  deletedIds: string[]
): CharacterRecord[] {
  const deletedSet = new Set(deletedIds);
  const byId = new Map<string, CharacterRecord>();

  for (const raw of existingList) {
    if (raw && typeof raw === 'object' && 'id' in raw) {
      const item = normalizeServerCharacterRecord(raw as CharacterRecord);
      if (typeof item.id === 'string' && !deletedSet.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }

  for (const raw of incomingList) {
    if (raw && typeof raw === 'object' && 'id' in raw) {
      const item = normalizeServerCharacterRecord(raw as CharacterRecord);
      if (typeof item.id === 'string' && !deletedSet.has(item.id)) {
        const existing = byId.get(item.id);
        if (!existing) {
          byId.set(item.id, item);
        } else {
          const earliestCreatedAt =
            typeof existing.createdAt === 'number' && typeof item.createdAt === 'number'
              ? Math.min(existing.createdAt, item.createdAt)
              : existing.createdAt ?? item.createdAt;
          byId.set(
            item.id,
            normalizeServerCharacterRecord({
              ...existing,
              ...item,
              ...(earliestCreatedAt !== undefined ? { createdAt: earliestCreatedAt } : {}),
            })
          );
        }
      }
    }
  }

  return Array.from(byId.values());
}

function mergeByIdOrCompositeKey(
  existingList: unknown[] | undefined,
  incomingList: unknown[] | undefined
): IdRecord[] {
  const safeExisting = Array.isArray(existingList) ? existingList : [];
  const safeIncoming = Array.isArray(incomingList) ? incomingList : [];

  // If incoming has items, prefer incoming order/updates while preserving any existing items not present if incoming was from an unhydrated client
  if (safeIncoming.length === 0 && safeExisting.length > 0) {
    return safeExisting as IdRecord[];
  }

  const byKey = new Map<string, IdRecord>();
  const getKey = (raw: unknown, idx: number): string => {
    if (raw && typeof raw === 'object') {
      const rec = raw as IdRecord;
      if (typeof rec.id === 'string' && rec.id.trim()) return rec.id.trim();
      if (rec.character || rec.quote || rec.date) {
        return `${rec.date || ''}|${rec.character || ''}|${rec.quote || ''}`;
      }
    }
    return `idx-${idx}`;
  };

  safeExisting.forEach((raw, idx) => {
    if (raw && typeof raw === 'object') {
      byKey.set(getKey(raw, idx), raw as IdRecord);
    }
  });

  safeIncoming.forEach((raw, idx) => {
    if (raw && typeof raw === 'object') {
      byKey.set(getKey(raw, idx), raw as IdRecord);
    }
  });

  return Array.from(byKey.values());
}

function readJsonFileSafe(filePath: string): PersistedWebState | null {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
          ...parsed,
        };
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function readPersistedState(): PersistedWebState {
  const mainState = readJsonFileSafe(STATE_FILE);
  const backupState = readJsonFileSafe(TMP_BACKUP_FILE);

  if (mainState && backupState) {
    const primary = backupState.updatedAt > mainState.updatedAt ? backupState : mainState;
    const secondary = backupState.updatedAt > mainState.updatedAt ? mainState : backupState;
    const deletedIds = Array.from(
      new Set([
        ...(Array.isArray(primary.deletedCharacterIds) ? primary.deletedCharacterIds : []),
        ...(Array.isArray(secondary.deletedCharacterIds) ? secondary.deletedCharacterIds : []),
      ])
    );
    const mergedChars = mergeCharacterRecords(
      Array.isArray(secondary.customCharacters) ? secondary.customCharacters : [],
      Array.isArray(primary.customCharacters) ? primary.customCharacters : [],
      deletedIds
    );
    return {
      ...secondary,
      ...primary,
      updatedAt: Math.max(mainState.updatedAt, backupState.updatedAt),
      customCharacters: mergedChars,
      deletedCharacterIds: deletedIds,
      shows: mergeByIdOrCompositeKey(secondary.shows, primary.shows),
      openWorlds: mergeByIdOrCompositeKey(secondary.openWorlds, primary.openWorlds),
      savedCommands: mergeByIdOrCompositeKey(secondary.savedCommands, primary.savedCommands),
      datingIdeas: mergeByIdOrCompositeKey(secondary.datingIdeas, primary.datingIdeas),
      memories: mergeByIdOrCompositeKey(secondary.memories, primary.memories),
      vibeOverrides: {
        ...(secondary.vibeOverrides || {}),
        ...(primary.vibeOverrides || {}),
      },
    };
  }

  return mainState || backupState || { updatedAt: 0 };
}

function syncAllStateToSourceFiles(state: PersistedWebState): void {
  const customChars = Array.isArray(state.customCharacters) ? state.customCharacters : [];
  const deletedIds = Array.isArray(state.deletedCharacterIds) ? state.deletedCharacterIds : [];

  // 1. Sync characters.ts
  try {
    if (fs.existsSync(CHARACTERS_TS_FILE)) {
      const rawTs = fs.readFileSync(CHARACTERS_TS_FILE, 'utf-8');
      const marker = 'export const INITIAL_CHARACTERS: CharacterProfile[] = ';
      const startIdx = rawTs.indexOf(marker);
      if (startIdx !== -1) {
        const jsonStart = startIdx + marker.length;
        const jsonPart = rawTs.slice(jsonStart).trim().replace(/;\s*$/, '');
        let existingInitial: CharacterRecord[] = [];
        try {
          const parsed = JSON.parse(jsonPart);
          if (Array.isArray(parsed)) existingInitial = parsed;
        } catch {
          existingInitial = [];
        }
        const mergedAll = mergeCharacterRecords(existingInitial, customChars, deletedIds);
        const nextFileContent = `import type { CharacterProfile } from "../types/character.ts";\n\nexport const INITIAL_CHARACTERS: CharacterProfile[] = ${JSON.stringify(mergedAll, null, 2)};\n`;
        if (nextFileContent !== rawTs) {
          fs.writeFileSync(CHARACTERS_TS_FILE, nextFileContent, 'utf-8');
        }
      }
    }
  } catch {
    // Ignore source sync errors
  }

  // 2. Sync datingIdeas.ts
  try {
    if (Array.isArray(state.datingIdeas) && state.datingIdeas.length > 0 && fs.existsSync(DATING_IDEAS_TS_FILE)) {
      const rawIdeas = fs.readFileSync(DATING_IDEAS_TS_FILE, 'utf-8');
      const nextIdeasContent = `import type { DatingIdeaItem } from '../types/character';\n\nexport const INITIAL_DATING_IDEAS: DatingIdeaItem[] = ${JSON.stringify(state.datingIdeas, null, 2)};\n`;
      if (nextIdeasContent !== rawIdeas) {
        fs.writeFileSync(DATING_IDEAS_TS_FILE, nextIdeasContent, 'utf-8');
      }
    }
  } catch {
    // Ignore
  }

  // 3. Sync multiverse.ts
  try {
    if (fs.existsSync(MULTIVERSE_TS_FILE)) {
      const shows = Array.isArray(state.shows) ? state.shows : [];
      const openWorlds = Array.isArray(state.openWorlds) ? state.openWorlds : [];
      const rawMultiverse = fs.readFileSync(MULTIVERSE_TS_FILE, 'utf-8');
      const nextMultiverseContent = `import type { MultiverseOpenWorld, MultiverseShow } from '../types/multiverse';\n\n// Bỏ hết show và OPW có sẵn để người dùng tự thêm vào theo yêu cầu\nexport const INITIAL_SHOWS: MultiverseShow[] = ${JSON.stringify(shows, null, 2)};\n\nexport const INITIAL_OPEN_WORLDS: MultiverseOpenWorld[] = ${JSON.stringify(openWorlds, null, 2)};\n`;
      if (nextMultiverseContent !== rawMultiverse) {
        fs.writeFileSync(MULTIVERSE_TS_FILE, nextMultiverseContent, 'utf-8');
      }
    }
  } catch {
    // Ignore
  }

  // 4. Sync persistedDefaults.ts
  try {
    if (fs.existsSync(PERSISTED_DEFAULTS_TS_FILE)) {
      const rawDefaults = fs.readFileSync(PERSISTED_DEFAULTS_TS_FILE, 'utf-8');
      const savedCommands = Array.isArray(state.savedCommands) ? state.savedCommands : [];
      const memories = Array.isArray(state.memories) ? state.memories : [];
      const favoriteIds = Array.isArray(state.favoriteIds) ? state.favoriteIds : [];
      const houseFavoriteRaw =
        typeof state.houseFavoriteRaw === 'string' ? state.houseFavoriteRaw : null;
      const vibeOverrides =
        state.vibeOverrides && typeof state.vibeOverrides === 'object'
          ? state.vibeOverrides
          : {};
      const activeVibe = state.activeVibe === 'dark' ? 'dark' : 'light';

      const nextDefaultsContent = [
        `import type { DiaryMemoryItem } from '../types/character';`,
        `import type { MusicVibeType } from '../utils/characterLogic';`,
        ``,
        `export interface SavedCommandRecord {`,
        `  id: string;`,
        `  title: string;`,
        `  content: string;`,
        `}`,
        ``,
        `export const INITIAL_SAVED_COMMANDS: SavedCommandRecord[] = ${JSON.stringify(savedCommands, null, 2)};`,
        ``,
        `export const INITIAL_MEMORIES: DiaryMemoryItem[] = ${JSON.stringify(memories, null, 2)};`,
        ``,
        `export const INITIAL_FAVORITE_IDS: string[] = ${JSON.stringify(favoriteIds, null, 2)};`,
        ``,
        `export const INITIAL_HOUSE_FAVORITE_RAW: string | null = ${JSON.stringify(houseFavoriteRaw)};`,
        ``,
        `export const INITIAL_VIBE_OVERRIDES: Record<string, MusicVibeType> = ${JSON.stringify(vibeOverrides, null, 2)};`,
        ``,
        `export const INITIAL_ACTIVE_VIBE: MusicVibeType = ${JSON.stringify(activeVibe)};`,
        ``,
      ].join('\n');

      if (nextDefaultsContent !== rawDefaults) {
        fs.writeFileSync(PERSISTED_DEFAULTS_TS_FILE, nextDefaultsContent, 'utf-8');
      }
    }
  } catch {
    // Ignore
  }
}

function writePersistedState(nextState: PersistedWebState): PersistedWebState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readPersistedState();
    const deletedIds = Array.from(
      new Set([
        ...(Array.isArray(current.deletedCharacterIds) ? current.deletedCharacterIds : []),
        ...(Array.isArray(nextState.deletedCharacterIds) ? nextState.deletedCharacterIds : []),
      ])
    );
    const mergedCharacters = mergeCharacterRecords(
      Array.isArray(current.customCharacters) ? current.customCharacters : [],
      Array.isArray(nextState.customCharacters) ? nextState.customCharacters : [],
      deletedIds
    );
    const mergedFavoriteIds = Array.from(
      new Set([
        ...(Array.isArray(current.favoriteIds) ? current.favoriteIds : []),
        ...(Array.isArray(nextState.favoriteIds) ? nextState.favoriteIds : []),
      ])
    ).filter((id) => !deletedIds.includes(id));

    const merged: PersistedWebState = {
      ...current,
      ...nextState,
      customCharacters: mergedCharacters,
      deletedCharacterIds: deletedIds,
      favoriteIds: mergedFavoriteIds,
      houseFavoriteRaw:
        nextState.houseFavoriteRaw !== undefined && nextState.houseFavoriteRaw !== null
          ? nextState.houseFavoriteRaw
          : current.houseFavoriteRaw ?? null,
      shows: mergeByIdOrCompositeKey(current.shows, nextState.shows),
      openWorlds: mergeByIdOrCompositeKey(current.openWorlds, nextState.openWorlds),
      savedCommands: mergeByIdOrCompositeKey(current.savedCommands, nextState.savedCommands),
      datingIdeas: mergeByIdOrCompositeKey(current.datingIdeas, nextState.datingIdeas),
      memories: mergeByIdOrCompositeKey(current.memories, nextState.memories),
      vibeOverrides: {
        ...(current.vibeOverrides || {}),
        ...(nextState.vibeOverrides || {}),
      },
      activeVibe:
        nextState.activeVibe === 'dark' || nextState.activeVibe === 'light'
          ? nextState.activeVibe
          : current.activeVibe || 'light',
      updatedAt:
        typeof nextState.updatedAt === 'number' && nextState.updatedAt > 0
          ? Math.max(nextState.updatedAt, current.updatedAt || 0)
          : Date.now(),
    };
    const serialized = JSON.stringify(merged, null, 2);
    fs.writeFileSync(STATE_FILE, serialized, 'utf-8');
    try {
      fs.writeFileSync(TMP_BACKUP_FILE, serialized, 'utf-8');
    } catch {
      // Ignore tmp backup errors
    }
    return merged;
  } catch {
    return nextState;
  }
}

async function startServer() {
  // Ensure .data/choco-state.json and /tmp/choco-state-backup.json are synced on startup
  const initialMergedState = readPersistedState();
  if (initialMergedState.updatedAt > 0) {
    const synced = writePersistedState(initialMergedState);
    syncAllStateToSourceFiles(synced);
  }

  const flushToSourceOnExit = () => {
    try {
      const latest = readPersistedState();
      if (latest.updatedAt > 0) {
        syncAllStateToSourceFiles(latest);
      }
    } catch {
      // Ignore exit sync errors
    }
  };
  process.once('SIGINT', () => {
    flushToSourceOnExit();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    flushToSourceOnExit();
    process.exit(0);
  });

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Prevent browser caching on API responses and HTML pages so changes always update immediately
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  app.get('/api/state', (_req, res) => {
    const state = readPersistedState();
    res.json(state);
  });

  app.put('/api/state', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid state payload' });
      return;
    }
    const saved = writePersistedState(body as PersistedWebState);
    res.json(saved);
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/.data/**', '**/src/data/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

