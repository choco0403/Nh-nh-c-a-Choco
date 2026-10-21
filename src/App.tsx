/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Heart,
  Home,
  Link2,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { INITIAL_CHARACTERS } from './data/characters';
import type { CharacterFormInput, CharacterProfile, DatingIdeaItem, DiaryMemoryItem } from './types/character';
import {
  appendSecretPasscodeKey,
  buildCharacterFromInput,
  extractUniqueAttributes,
  filterCharacters,
  getMsUntilNextMidnight,
  hasUnsyncedLocalCharacters,
  isCharacterNew,
  mergeAndSortCharacters,
  mergeCustomCharacterLists,
  normalizeCharacterTimestamps,
  resolveValidHouseFavoriteId,
  serializeHouseFavoriteForToday,
  shortenLinkDisplay,
} from './utils/characterLogic';
import { CharacterArtwork } from './components/CharacterArtwork';
import { ProfileModal } from './components/ProfileModal';
import { CharacterFormModal } from './components/CharacterFormModal';
import { AmbientMusicPlayer } from './components/AmbientMusicPlayer';
import { MultiverseSection } from './components/MultiverseSection';
import { RandomPickerModal } from './components/RandomPickerModal';
import { MagicCursor } from './components/MagicCursor';
import { ChocoCorner } from './components/ChocoCorner';
import { LofiClock } from './components/LofiClock';
import { DatingIdeasModal } from './components/DatingIdeasModal';
import { MemoryDiaryModal } from './components/MemoryDiaryModal';
import { GameHubModal } from './components/GameHubModal';
import { INITIAL_SHOWS, INITIAL_OPEN_WORLDS } from './data/multiverse';
import { INITIAL_DATING_IDEAS } from './data/datingIdeas';
import {
  INITIAL_FAVORITE_IDS,
  INITIAL_HOUSE_FAVORITE_RAW,
  INITIAL_MEMORIES,
  INITIAL_SAVED_COMMANDS,
} from './data/persistedDefaults';
import type {
  MultiverseOpenWorld,
  MultiverseShow,
  OpenWorldFormInput,
  ShowFormInput,
} from './types/multiverse';

const STORAGE_KEY_CUSTOM = 'choco_house_custom_characters_v4';
const LEGACY_CUSTOM_KEYS = [
  'choco_house_custom_characters_v4',
  'choco_house_custom_characters_v3',
  'choco_house_custom_characters_v2',
  'choco_house_custom_characters_v1',
  'choco_custom_characters',
];
const LEGACY_PLACEHOLDER_IDS = new Set([
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'char-1',
  'char-2',
  'char-3',
  'char-4',
  'char-5',
  'char-6',
  'linh-dan',
  'kaelen-vex',
  'seraphina',
  'shen-yi',
  'aurelia',
  'takeshi',
]);

function readRescuedCustomCharactersFromStorage(deletedIds: string[] = []): CharacterProfile[] {
  const deletedSet = new Set(deletedIds);
  const byId = new Map<string, CharacterProfile>();
  try {
    for (const key of [...LEGACY_CUSTOM_KEYS].reverse()) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        for (const item of parsed) {
          if (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            !LEGACY_PLACEHOLDER_IDS.has(item.id) &&
            !deletedSet.has(item.id)
          ) {
            byId.set(item.id, normalizeCharacterTimestamps(item as CharacterProfile));
          }
        }
      } catch {
        // Ignore invalid JSON
      }
    }
  } catch {
    // Ignore storage access errors
  }
  return Array.from(byId.values());
}

const STORAGE_KEY_DELETED_IDS = 'choco_house_deleted_character_ids_v1';
const STORAGE_KEY_FAVORITES = 'choco_house_favorite_ids_v4';
const STORAGE_KEY_COMMANDS = 'choco_house_commands_v1';
const STORAGE_KEY_DATING_IDEAS = 'choco_house_dating_ideas_v1';
const STORAGE_KEY_MEMORIES = 'chocoMemories';
const STORAGE_KEY_HOUSE_FAVORITE = 'choco_house_most_loved_member_v1';
const STORAGE_KEY_SHOWS = 'choco_house_multiverse_shows_v3';
const STORAGE_KEY_OPW = 'choco_house_multiverse_opw_v3';
const STORAGE_KEY_VIBE_OVERRIDES = 'choco_house_music_vibe_overrides_v1';
const STORAGE_KEY_ACTIVE_VIBE = 'choco_house_active_music_vibe_v1';
const STORAGE_KEY_UPDATED_AT = 'choco_house_state_updated_at_v1';

interface SavedCommandItem {
  id: string;
  title: string;
  content: string;
}

const STARFIELD_ITEMS = Array.from({ length: 36 }, (_, idx) => {
  const top = `${(idx * 17 + 7) % 96}%`;
  const left = `${(idx * 29 + 11) % 97}%`;
  const size = (idx % 3) + 2.5;
  const duration = `${2.4 + (idx % 5) * 0.65}s`;
  const delay = `${(idx % 7) * 0.45}s`;
  return { id: `star-${idx}`, top, left, size, duration, delay };
});

const FALLING_ITEMS = Array.from({ length: 14 }, (_, idx) => {
  const left = `${(idx * 23 + 5) % 94}%`;
  const duration = `${6 + (idx % 4) * 1.8}s`;
  const delay = `${(idx % 6) * 1.2}s`;
  const size = (idx % 3) + 8;
  return { id: `fall-${idx}`, left, duration, delay, size };
});

const SESSION_KEY_ENTERED_LIBRARY = 'choco_has_entered_library_v1';
const SESSION_KEY_FORM_OPEN = 'choco_is_form_open_v1';

export default function App() {
  // Start on the Welcome Screen on initial visit; stay on Home Page during active session or when adding a character
  const [hasEnteredLibrary, setHasEnteredLibrary] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return true;
      if (
        sessionStorage.getItem(SESSION_KEY_ENTERED_LIBRARY) === '1' ||
        sessionStorage.getItem(SESSION_KEY_FORM_OPEN) === '1'
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [deletedCharacterIds, setDeletedCharacterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customCharacters, setCustomCharacters] = useState<CharacterProfile[]>(() =>
    readRescuedCustomCharactersFromStorage(deletedCharacterIds)
  );

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      return saved ? JSON.parse(saved) : INITIAL_FAVORITE_IDS;
    } catch {
      return INITIAL_FAVORITE_IDS;
    }
  });

  // Search & Filter States (Creator + Tags + Keyword + Favorites)
  const [selectedCreator, setSelectedCreator] = useState<string>('Tất cả');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Active viewed dossier
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);

  // Most loved member of the house ("Em thương anh nhất mà") - resets every day at 24:00 so yesterday's favorite is hidden
  const [houseFavoriteId, setHouseFavoriteId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HOUSE_FAVORITE) || INITIAL_HOUSE_FAVORITE_RAW;
      const validId = resolveValidHouseFavoriteId(raw, new Date());
      if (!validId && localStorage.getItem(STORAGE_KEY_HOUSE_FAVORITE)) {
        localStorage.removeItem(STORAGE_KEY_HOUSE_FAVORITE);
      }
      return validId;
    } catch {
      return null;
    }
  });

  // Multiverse ("Đa vũ trụ") view mode
  const [isMultiverseView, setIsMultiverseView] = useState(false);
  const [shows, setShows] = useState<MultiverseShow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOWS);
      return saved ? JSON.parse(saved) : INITIAL_SHOWS;
    } catch {
      return INITIAL_SHOWS;
    }
  });
  const [openWorlds, setOpenWorlds] = useState<MultiverseOpenWorld[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OPW);
      return saved ? JSON.parse(saved) : INITIAL_OPEN_WORLDS;
    } catch {
      return INITIAL_OPEN_WORLDS;
    }
  });

  const [isFormOpen, setIsFormOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY_FORM_OPEN) === '1';
    } catch {
      return false;
    }
  });
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);
  const isFormOpenRef = useRef<boolean>(isFormOpen);
  isFormOpenRef.current = isFormOpen;

  useEffect(() => {
    try {
      if (isFormOpen && !editingCharacter) {
        sessionStorage.setItem(SESSION_KEY_FORM_OPEN, '1');
        sessionStorage.setItem(SESSION_KEY_ENTERED_LIBRARY, '1');
      } else {
        sessionStorage.removeItem(SESSION_KEY_FORM_OPEN);
      }
    } catch {
      // Ignore storage errors
    }
  }, [isFormOpen, editingCharacter]);

  // Random character picker modal ("Hôm nay bé sẽ hẹn hò cùng ai?")
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);

  // Standalone Choco Corner notification modal ("Góc nhỏ của Choco")
  const [isChocoCornerOpen, setIsChocoCornerOpen] = useState(false);

  // Welcome screen fade-out state & auto-play trigger + typewriter state
  const [welcomeFadingOut, setWelcomeFadingOut] = useState(false);
  const [musicAutoPlayTrigger] = useState(0);
  const fullHeroSubtitle =
    'Mỗi anh đều sở hữu câu chuyện của riêng mình, chỉ đợi bé mở cánh cửa rồi bước qua thôi';
  const [typedSubtitle, setTypedSubtitle] = useState<string>(fullHeroSubtitle);
  const typewriterTimerRef = useRef<number | null>(null);

  // Easter Egg ("choco") state
  const chuoiGoPhipRef = useRef<string>('');
  const [isEasterEggAlertOpen, setIsEasterEggAlertOpen] = useState(false);

  // Spotlight Light Switch ("Kéo để tắt đèn") state
  const [isDarkSpotlight, setIsDarkSpotlight] = useState(false);
  const isDarkSpotlightRef = useRef(false);
  const darknessOverlayRef = useRef<HTMLDivElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 720,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 450,
  });

  // Command Vault ("Kho lệnh") mini-page state
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [savedCommands, setSavedCommands] = useState<SavedCommandItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMANDS);
      return saved ? JSON.parse(saved) : INITIAL_SAVED_COMMANDS;
    } catch {
      return INITIAL_SAVED_COMMANDS;
    }
  });
  const [commandTitle, setCommandTitle] = useState('');
  const [commandContent, setCommandContent] = useState('');
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);

  // Heart Menu Popover state ("Kho lệnh" + "Idea hẹn hò" options)
  const [isHeartMenuOpen, setIsHeartMenuOpen] = useState(false);
  const heartMenuRef = useRef<HTMLDivElement | null>(null);

  // Dating Ideas ("Idea hẹn hò") state
  const [isDatingIdeasOpen, setIsDatingIdeasOpen] = useState(false);
  const [datingIdeas, setDatingIdeas] = useState<DatingIdeaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATING_IDEAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to initial ideas
    }
    return INITIAL_DATING_IDEAS;
  });

  // Sổ Tay Ký Ức state
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);

  // Khu Vườn Trò Chơi (Minigame Hub) state
  const [isGameHubOpen, setIsGameHubOpen] = useState(false);

  useEffect(() => {
    const win = window as unknown as {
      openGameHub?: () => void;
      closeGameHub?: () => void;
    };
    win.openGameHub = () => setIsGameHubOpen(true);
    win.closeGameHub = () => setIsGameHubOpen(false);
    return () => {
      delete win.openGameHub;
      delete win.closeGameHub;
    };
  }, []);
  const [memories, setMemories] = useState<DiaryMemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MEMORIES;
  });

  const isHydratingFromServerRef = useRef<boolean>(false);
  const hasCompletedInitialSyncRef = useRef<boolean>(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (!hasEnteredLibrary) {
      window.scrollTo(0, 0);
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [hasEnteredLibrary]);

  const startTypewriterEffect = () => {
    if (typewriterTimerRef.current) {
      window.clearInterval(typewriterTimerRef.current);
    }
    let idx = 0;
    setTypedSubtitle('');
    typewriterTimerRef.current = window.setInterval(() => {
      idx += 1;
      setTypedSubtitle(fullHeroSubtitle.slice(0, idx));
      if (idx >= fullHeroSubtitle.length && typewriterTimerRef.current) {
        window.clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    }, 28);
  };

  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) {
        window.clearInterval(typewriterTimerRef.current);
      }
    };
  }, []);

  const handleEnterFromWelcome = () => {
    if (welcomeFadingOut) return;
    try {
      sessionStorage.setItem(SESSION_KEY_ENTERED_LIBRARY, '1');
    } catch {
      // Ignore storage errors
    }
    // 1. Tắt màn hình chào và mở khóa cuộn trang (chỉ phát nhạc khi người dùng chủ động ấn bật nhạc)
    setWelcomeFadingOut(true);
    document.body.classList.remove('no-scroll');

    // 2. Khởi động máy đánh chữ sau khi khách đã vào trong (800ms)
    window.setTimeout(() => {
      startTypewriterEffect();
    }, 800);

    window.setTimeout(() => {
      setHasEnteredLibrary(true);
      setWelcomeFadingOut(false);
    }, 900);
  };

  const liveStateRef = useRef({
    customCharacters,
    deletedCharacterIds,
    favoriteIds,
    shows,
    openWorlds,
    savedCommands,
    datingIdeas,
    memories,
  });
  liveStateRef.current = {
    customCharacters,
    deletedCharacterIds,
    favoriteIds,
    shows,
    openWorlds,
    savedCommands,
    datingIdeas,
    memories,
  };

  // Push current state snapshot to backend server (/api/state)
  const pushStateToServer = (
    timestamp: number,
    overrides?: {
      customCharacters?: CharacterProfile[];
      deletedCharacterIds?: string[];
    }
  ) => {
    try {
      const snap = liveStateRef.current;
      const payload = {
        updatedAt: timestamp,
        customCharacters: overrides?.customCharacters ?? snap.customCharacters,
        deletedCharacterIds: overrides?.deletedCharacterIds ?? snap.deletedCharacterIds,
        favoriteIds: snap.favoriteIds,
        houseFavoriteRaw: localStorage.getItem(STORAGE_KEY_HOUSE_FAVORITE) || null,
        shows: snap.shows,
        openWorlds: snap.openWorlds,
        savedCommands: snap.savedCommands,
        datingIdeas: snap.datingIdeas,
        memories: snap.memories,
        vibeOverrides: JSON.parse(localStorage.getItem(STORAGE_KEY_VIBE_OVERRIDES) || '{}'),
        activeVibe: localStorage.getItem(STORAGE_KEY_ACTIVE_VIBE) || 'light',
      };
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Ignore network errors when running purely static
      });
    } catch {
      // Ignore serialization errors
    }
  };

  const markLocalMutationAndSync = () => {
    if (isHydratingFromServerRef.current || !hasCompletedInitialSyncRef.current) return;
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_UPDATED_AT, String(now));
    } catch {
      // Ignore
    }
    pushStateToServer(now);
  };

  // Initial & focus sync between localStorage and /api/state + cross-tab storage event listener
  useEffect(() => {
    const hydrateFromLocalStorage = () => {
      try {
        const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM);
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed)) {
            setCustomCharacters(parsed.map((c) => normalizeCharacterTimestamps(c)));
          }
        }

        const savedDeleted = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
        if (savedDeleted) setDeletedCharacterIds(JSON.parse(savedDeleted));

        const savedFavs = localStorage.getItem(STORAGE_KEY_FAVORITES);
        if (savedFavs) setFavoriteIds(JSON.parse(savedFavs));

        const savedCmds = localStorage.getItem(STORAGE_KEY_COMMANDS);
        if (savedCmds) setSavedCommands(JSON.parse(savedCmds));

        const savedIdeas = localStorage.getItem(STORAGE_KEY_DATING_IDEAS);
        if (savedIdeas) setDatingIdeas(JSON.parse(savedIdeas));

        const savedMemories = localStorage.getItem(STORAGE_KEY_MEMORIES);
        if (savedMemories) setMemories(JSON.parse(savedMemories));

        const savedShows = localStorage.getItem(STORAGE_KEY_SHOWS);
        if (savedShows) setShows(JSON.parse(savedShows));

        const savedOpw = localStorage.getItem(STORAGE_KEY_OPW);
        if (savedOpw) setOpenWorlds(JSON.parse(savedOpw));

        const rawHouseFav = localStorage.getItem(STORAGE_KEY_HOUSE_FAVORITE);
        setHouseFavoriteId(resolveValidHouseFavoriteId(rawHouseFav, new Date()));
      } catch {
        // Ignore
      }
    };

    const syncWithServer = async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) {
          hasCompletedInitialSyncRef.current = true;
          return;
        }
        const serverState = await res.json();
        const serverUpdatedAt =
          typeof serverState?.updatedAt === 'number' ? serverState.updatedAt : 0;
        const localUpdatedAt = Number(localStorage.getItem(STORAGE_KEY_UPDATED_AT) || '0');

        let storedLocalDeleted: string[] = [];
        try {
          const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_DELETED_IDS) || '[]');
          if (Array.isArray(parsed)) storedLocalDeleted = parsed;
        } catch {
          // Ignore
        }
        const serverDeleted: string[] = Array.isArray(serverState.deletedCharacterIds)
          ? serverState.deletedCharacterIds
          : [];
        const mergedDeletedIds =
          serverUpdatedAt > localUpdatedAt
            ? Array.from(new Set([...serverDeleted, ...storedLocalDeleted]))
            : Array.from(new Set([...storedLocalDeleted, ...serverDeleted]));

        const storedLocalCustom = readRescuedCustomCharactersFromStorage(mergedDeletedIds);
        const currentLocalCustom = mergeCustomCharacterLists(
          liveStateRef.current.customCharacters,
          storedLocalCustom,
          mergedDeletedIds
        );

        const serverCustom: CharacterProfile[] = Array.isArray(serverState.customCharacters)
          ? serverState.customCharacters
          : [];

        // Non-destructively union-merge local and server characters so locally created characters are never lost
        const mergedCustom = mergeCustomCharacterLists(
          currentLocalCustom,
          serverCustom,
          mergedDeletedIds,
          serverUpdatedAt > localUpdatedAt
        );

        const hasCharacterDiff =
          hasUnsyncedLocalCharacters(currentLocalCustom, serverCustom, mergedDeletedIds) ||
          JSON.stringify(mergedCustom) !== JSON.stringify(serverCustom);

        const hasOtherLocalUnsynced =
          (liveStateRef.current.shows.length > 0 &&
            JSON.stringify(liveStateRef.current.shows) !==
              JSON.stringify(serverState.shows || [])) ||
          (liveStateRef.current.openWorlds.length > 0 &&
            JSON.stringify(liveStateRef.current.openWorlds) !==
              JSON.stringify(serverState.openWorlds || [])) ||
          (liveStateRef.current.savedCommands.length > 0 &&
            JSON.stringify(liveStateRef.current.savedCommands) !==
              JSON.stringify(serverState.savedCommands || [])) ||
          (liveStateRef.current.memories.length > 0 &&
            JSON.stringify(liveStateRef.current.memories) !==
              JSON.stringify(serverState.memories || [])) ||
          (liveStateRef.current.datingIdeas.length > 0 &&
            JSON.stringify(liveStateRef.current.datingIdeas) !==
              JSON.stringify(serverState.datingIdeas || []));

        const localHasUnsynced = hasCharacterDiff || hasOtherLocalUnsynced;

        const hasExistingLocalData =
          currentLocalCustom.length > 0 ||
          (localStorage.getItem(STORAGE_KEY_FAVORITES) &&
            localStorage.getItem(STORAGE_KEY_FAVORITES) !== '[]') ||
          (localStorage.getItem(STORAGE_KEY_SHOWS) &&
            localStorage.getItem(STORAGE_KEY_SHOWS) !== '[]') ||
          (localStorage.getItem(STORAGE_KEY_OPW) &&
            localStorage.getItem(STORAGE_KEY_OPW) !== '[]') ||
          (localStorage.getItem(STORAGE_KEY_COMMANDS) &&
            localStorage.getItem(STORAGE_KEY_COMMANDS) !== '[]') ||
          (localStorage.getItem(STORAGE_KEY_MEMORIES) &&
            localStorage.getItem(STORAGE_KEY_MEMORIES) !== '[]') ||
          Boolean(localStorage.getItem(STORAGE_KEY_HOUSE_FAVORITE));

        if (serverUpdatedAt > localUpdatedAt) {
          isHydratingFromServerRef.current = true;
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(mergedCustom));
          } catch {
            // Ignore quota errors
          }
          setCustomCharacters(mergedCustom);

          try {
            localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(mergedDeletedIds));
          } catch {
            // Ignore
          }
          setDeletedCharacterIds(mergedDeletedIds);

          if (Array.isArray(serverState.favoriteIds)) {
            const mergedFavs = Array.from(
              new Set([...liveStateRef.current.favoriteIds, ...serverState.favoriteIds])
            );
            try {
              localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(mergedFavs));
            } catch {
              // Ignore
            }
            setFavoriteIds(mergedFavs);
          }
          if (serverState.houseFavoriteRaw !== undefined) {
            const validId = resolveValidHouseFavoriteId(
              serverState.houseFavoriteRaw,
              new Date()
            );
            if (validId && serverState.houseFavoriteRaw) {
              localStorage.setItem(STORAGE_KEY_HOUSE_FAVORITE, serverState.houseFavoriteRaw);
            } else {
              localStorage.removeItem(STORAGE_KEY_HOUSE_FAVORITE);
            }
            setHouseFavoriteId(validId);
          }
          if (Array.isArray(serverState.shows) && serverState.shows.length > 0) {
            localStorage.setItem(STORAGE_KEY_SHOWS, JSON.stringify(serverState.shows));
            setShows(serverState.shows);
          }
          if (Array.isArray(serverState.openWorlds) && serverState.openWorlds.length > 0) {
            localStorage.setItem(STORAGE_KEY_OPW, JSON.stringify(serverState.openWorlds));
            setOpenWorlds(serverState.openWorlds);
          }
          if (Array.isArray(serverState.savedCommands) && serverState.savedCommands.length > 0) {
            localStorage.setItem(
              STORAGE_KEY_COMMANDS,
              JSON.stringify(serverState.savedCommands)
            );
            setSavedCommands(serverState.savedCommands);
          }
          if (Array.isArray(serverState.datingIdeas) && serverState.datingIdeas.length > 0) {
            localStorage.setItem(
              STORAGE_KEY_DATING_IDEAS,
              JSON.stringify(serverState.datingIdeas)
            );
            setDatingIdeas(serverState.datingIdeas);
          }
          if (Array.isArray(serverState.memories) && serverState.memories.length > 0) {
            localStorage.setItem(
              STORAGE_KEY_MEMORIES,
              JSON.stringify(serverState.memories)
            );
            setMemories(serverState.memories);
          }
          if (serverState.vibeOverrides && typeof serverState.vibeOverrides === 'object') {
            localStorage.setItem(
              STORAGE_KEY_VIBE_OVERRIDES,
              JSON.stringify(serverState.vibeOverrides)
            );
          }
          if (serverState.activeVibe === 'light' || serverState.activeVibe === 'dark') {
            localStorage.setItem(STORAGE_KEY_ACTIVE_VIBE, serverState.activeVibe);
          }
          const nextTs = localHasUnsynced ? Date.now() : serverUpdatedAt;
          localStorage.setItem(STORAGE_KEY_UPDATED_AT, String(nextTs));
          window.dispatchEvent(new CustomEvent('choco-state-hydrated'));
          window.setTimeout(() => {
            isHydratingFromServerRef.current = false;
            hasCompletedInitialSyncRef.current = true;
            if (localHasUnsynced) {
              pushStateToServer(nextTs, {
                customCharacters: mergedCustom,
                deletedCharacterIds: mergedDeletedIds,
              });
            }
          }, 50);
        } else if (
          (localUpdatedAt > serverUpdatedAt ||
            localHasUnsynced ||
            (serverUpdatedAt === 0 && hasExistingLocalData)) &&
          !isHydratingFromServerRef.current
        ) {
          const ts = Math.max(localUpdatedAt, serverUpdatedAt, Date.now());
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(mergedCustom));
            localStorage.setItem(STORAGE_KEY_UPDATED_AT, String(ts));
          } catch {
            // Ignore
          }
          setCustomCharacters(mergedCustom);
          hasCompletedInitialSyncRef.current = true;
          pushStateToServer(ts, {
            customCharacters: mergedCustom,
            deletedCharacterIds: mergedDeletedIds,
          });
        } else {
          hasCompletedInitialSyncRef.current = true;
        }
      } catch {
        hasCompletedInitialSyncRef.current = true;
      }
    };

    syncWithServer();

    const handleStorageEvent = () => {
      hydrateFromLocalStorage();
    };
    const handleMusicStateChanged = () => {
      markLocalMutationAndSync();
    };
    const handleWindowFocus = () => {
      if (isFormOpenRef.current) return;
      syncWithServer();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isFormOpenRef.current) {
        syncWithServer();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('choco-music-state-changed', handleMusicStateChanged);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('choco-music-state-changed', handleMusicStateChanged);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customCharacters));
    } catch {
      // Ignore storage quota errors
    }
    markLocalMutationAndSync();
  }, [customCharacters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(deletedCharacterIds));
    } catch {
      // Ignore storage quota errors
    }
    markLocalMutationAndSync();
  }, [deletedCharacterIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage quota errors
    }
    markLocalMutationAndSync();
  }, [favoriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMMANDS, JSON.stringify(savedCommands));
    } catch {
      // Ignore storage quota errors
    }
    markLocalMutationAndSync();
  }, [savedCommands]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DATING_IDEAS, JSON.stringify(datingIdeas));
    } catch {
      // Ignore storage quota errors
    }
    markLocalMutationAndSync();
  }, [datingIdeas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
    } catch {
      // Ignore storage quota errors
    }
    markLocalMutationAndSync();
  }, [memories]);

  // Click outside and Escape key handler for Heart Menu Popover
  useEffect(() => {
    if (!isHeartMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (heartMenuRef.current && !heartMenuRef.current.contains(e.target as Node)) {
        setIsHeartMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHeartMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHeartMenuOpen]);

  // Auto-expire houseFavoriteId at 24:00 (00:00 of the next day) so yesterday's favorite is never shown on a new day
  useEffect(() => {
    const syncAndCheckMidnightExpiry = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_HOUSE_FAVORITE);
        const validId = resolveValidHouseFavoriteId(raw, new Date());
        if (!validId) {
          if (raw) {
            localStorage.removeItem(STORAGE_KEY_HOUSE_FAVORITE);
          }
          setHouseFavoriteId((prev) => (prev !== null ? null : prev));
        }
      } catch {
        // Ignore storage errors
      }
    };

    syncAndCheckMidnightExpiry();

    let midnightTimeoutId: number | null = null;
    const scheduleNextMidnightReset = () => {
      const msUntilMidnight = getMsUntilNextMidnight(new Date()) + 100;
      midnightTimeoutId = window.setTimeout(() => {
        syncAndCheckMidnightExpiry();
        scheduleNextMidnightReset();
      }, msUntilMidnight);
    };

    scheduleNextMidnightReset();
    const intervalId = window.setInterval(syncAndCheckMidnightExpiry, 15000);
    window.addEventListener('focus', syncAndCheckMidnightExpiry);
    document.addEventListener('visibilitychange', syncAndCheckMidnightExpiry);

    return () => {
      if (midnightTimeoutId !== null) window.clearTimeout(midnightTimeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncAndCheckMidnightExpiry);
      document.removeEventListener('visibilitychange', syncAndCheckMidnightExpiry);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SHOWS, JSON.stringify(shows));
      markLocalMutationAndSync();
    } catch {
      // Ignore storage quota errors
    }
  }, [shows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OPW, JSON.stringify(openWorlds));
      markLocalMutationAndSync();
    } catch {
      // Ignore storage quota errors
    }
  }, [openWorlds]);

  const handleAddShow = (input: ShowFormInput) => {
    const newShow: MultiverseShow = {
      id: `show-${Date.now()}`,
      title: input.title.trim(),
      description: input.description.trim(),
      charactersInfo: input.charactersInfo.trim(),
      link: input.link.trim(),
      tags: input.tagsText
        ? input.tagsText.split(/[,，·]+/).map((t) => t.trim()).filter(Boolean)
        : [],
      createdAt: Date.now(),
    };
    setShows((prev) => [newShow, ...prev]);
  };

  const handleUpdateShow = (id: string, input: ShowFormInput) => {
    setShows((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              title: input.title.trim(),
              description: input.description.trim(),
              charactersInfo: input.charactersInfo.trim(),
              link: input.link.trim(),
              tags: input.tagsText
                ? input.tagsText.split(/[,，·]+/).map((t) => t.trim()).filter(Boolean)
                : [],
            }
          : s
      )
    );
  };

  const handleDeleteShow = (id: string) => {
    setShows((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddOpenWorld = (input: OpenWorldFormInput) => {
    const newOpw: MultiverseOpenWorld = {
      id: `opw-${Date.now()}`,
      title: input.title.trim(),
      description: input.description.trim(),
      link: input.link.trim(),
      tags: input.tagsText
        ? input.tagsText.split(/[,，·]+/).map((t) => t.trim()).filter(Boolean)
        : [],
      createdAt: Date.now(),
    };
    setOpenWorlds((prev) => [newOpw, ...prev]);
  };

  const handleUpdateOpenWorld = (id: string, input: OpenWorldFormInput) => {
    setOpenWorlds((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              title: input.title.trim(),
              description: input.description.trim(),
              link: input.link.trim(),
              tags: input.tagsText
                ? input.tagsText.split(/[,，·]+/).map((t) => t.trim()).filter(Boolean)
                : [],
            }
          : o
      )
    );
  };

  const handleDeleteOpenWorld = (id: string) => {
    setOpenWorlds((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandTitle.trim() || !commandContent.trim()) return;
    if (editingCommandId) {
      setSavedCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === editingCommandId
            ? { ...cmd, title: commandTitle.trim(), content: commandContent.trim() }
            : cmd
        )
      );
      setEditingCommandId(null);
    } else {
      const newCmd: SavedCommandItem = {
        id: `cmd-${Date.now()}`,
        title: commandTitle.trim(),
        content: commandContent.trim(),
      };
      setSavedCommands((prev) => [newCmd, ...prev]);
    }
    setCommandTitle('');
    setCommandContent('');
  };

  const handleStartEditCommand = (cmd: SavedCommandItem) => {
    setEditingCommandId(cmd.id);
    setCommandTitle(cmd.title);
    setCommandContent(cmd.content);
  };

  const handleCancelEditCommand = () => {
    setEditingCommandId(null);
    setCommandTitle('');
    setCommandContent('');
  };

  const handleDeleteCommand = (id: string) => {
    setSavedCommands((prev) => prev.filter((c) => c.id !== id));
    if (editingCommandId === id) {
      handleCancelEditCommand();
    }
  };

  const handleCopyCommand = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCommandId(id);
    window.setTimeout(() => {
      setCopiedCommandId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // Dating Ideas handlers
  const handleAddDatingIdea = (title: string, category: string, content: string) => {
    const newIdea: DatingIdeaItem = {
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      category,
      content,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setDatingIdeas((prev) => [newIdea, ...prev]);
  };

  const handleUpdateDatingIdea = (
    id: string,
    title: string,
    category: string,
    content: string
  ) => {
    setDatingIdeas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title, category, content } : item
      )
    );
  };

  const handleDeleteDatingIdea = (id: string) => {
    setDatingIdeas((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleCompleteDatingIdea = (id: string) => {
    setDatingIdeas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  // Sổ Tay Ký Ức handlers
  const handleSaveMemory = (char: string, quote: string, thought: string) => {
    const newMemory: DiaryMemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toLocaleString('vi-VN'),
      character: char.trim(),
      quote: quote.trim(),
      thought: thought.trim(),
    };
    setMemories((prev) => [newMemory, ...prev]);
  };

  const handleDeleteMemory = (index: number) => {
    setMemories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRestoreMemories = (restoredMemories: DiaryMemoryItem[]) => {
    setMemories(restoredMemories);
  };

  // Every character can be edited and deleted: overrides from customCharacters take precedence over INITIAL_CHARACTERS, and deletedCharacterIds are excluded
  // Tên của các thành viên phải được sắp xếp từ A-Z, trước các thành viên đấy sẽ là các thành viên mới add vào cũng phải xếp theo A-Z
  const allCharacters = useMemo(
    () =>
      mergeAndSortCharacters(
        INITIAL_CHARACTERS,
        customCharacters,
        deletedCharacterIds
      ),
    [customCharacters, deletedCharacterIds]
  );

  const favoriteCharacters = useMemo(
    () => allCharacters.filter((char) => favoriteIds.includes(char.id)),
    [allCharacters, favoriteIds]
  );

  const { tags: availableTags, creators: availableCreators } = useMemo(
    () => extractUniqueAttributes(allCharacters),
    [allCharacters]
  );

  const filteredCharacters = useMemo(
    () =>
      filterCharacters(allCharacters, {
        selectedCreator,
        selectedTags,
        searchQuery,
        onlyFavorites,
        favoriteIds,
      }),
    [allCharacters, selectedCreator, selectedTags, searchQuery, onlyFavorites, favoriteIds]
  );

  // House favorite chosen via "Em thương anh nhất mà" inside profile modal
  const houseFavoriteCharacter = useMemo(
    () => (houseFavoriteId ? allCharacters.find((c) => c.id === houseFavoriteId) || null : null),
    [allCharacters, houseFavoriteId]
  );

  const activeCharacterIndex = useMemo(
    () => allCharacters.findIndex((c) => c.id === activeCharacterId),
    [allCharacters, activeCharacterId]
  );

  const activeCharacter = useMemo(
    () => allCharacters.find((c) => c.id === activeCharacterId) || null,
    [allCharacters, activeCharacterId]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCreator !== 'Tất cả') count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (searchQuery.trim() !== '') count++;
    if (onlyFavorites) count++;
    return count;
  }, [selectedCreator, selectedTags, searchQuery, onlyFavorites]);

  const handleToggleFavorite = (characterId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(characterId)
        ? prev.filter((id) => id !== characterId)
        : [...prev, characterId]
    );
  };

  const handleSetHouseFavorite = (id: string) => {
    setHouseFavoriteId((prev) => {
      const nextId = prev === id ? null : id;
      try {
        const serialized = serializeHouseFavoriteForToday(nextId, new Date());
        if (serialized) {
          localStorage.setItem(STORAGE_KEY_HOUSE_FAVORITE, serialized);
        } else {
          localStorage.removeItem(STORAGE_KEY_HOUSE_FAVORITE);
        }
        markLocalMutationAndSync();
      } catch {
        // Ignore storage quota errors
      }
      return nextId;
    });
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Every character can be edited!
  const handleSaveCharacter = (input: CharacterFormInput, existingId?: string) => {
    if (existingId) {
      setDeletedCharacterIds((prev) => prev.filter((id) => id !== existingId));
      setCustomCharacters((prev) => {
        const existingInCustom = prev.find((c) => c.id === existingId);
        const existingInitial = INITIAL_CHARACTERS.find((c) => c.id === existingId);
        const baseChar = existingInCustom || existingInitial || null;

        if (existingInCustom) {
          return prev.map((c, idx) =>
            c.id === existingId
              ? buildCharacterFromInput(input, idx, existingId, c.createdAt, baseChar)
              : c
          );
        } else {
          const updated = buildCharacterFromInput(
            input,
            0,
            existingId,
            baseChar?.createdAt,
            baseChar
          );
          return [updated, ...prev];
        }
      });
      setActiveCharacterId(existingId);
    } else {
      const created = buildCharacterFromInput(
        input,
        allCharacters.length,
        undefined,
        Date.now(),
        null
      );
      setCustomCharacters((prev) => [created, ...prev]);
      setActiveCharacterId(null);
      setIsMultiverseView(false);
    }
  };

  const handleDeleteCharacter = (id: string) => {
    setDeletedCharacterIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCustomCharacters((prev) => prev.filter((c) => c.id !== id));
    setFavoriteIds((prev) => prev.filter((favId) => favId !== id));
    if (houseFavoriteId === id) {
      setHouseFavoriteId(null);
      try {
        localStorage.removeItem(STORAGE_KEY_HOUSE_FAVORITE);
        markLocalMutationAndSync();
      } catch {
        // Ignore storage errors
      }
    }
    if (activeCharacterId === id) {
      setActiveCharacterId(null);
    }
  };

  const handleSelectPrevious = () => {
    const pool = filteredCharacters.length > 0 ? filteredCharacters : allCharacters;
    if (pool.length === 0) return;
    const idx = pool.findIndex((c) => c.id === activeCharacterId);
    const prevIdx = idx <= 0 ? pool.length - 1 : idx - 1;
    setActiveCharacterId(pool[prevIdx].id);
  };

  const handleSelectNext = () => {
    const pool = filteredCharacters.length > 0 ? filteredCharacters : allCharacters;
    if (pool.length === 0) return;
    const idx = pool.findIndex((c) => c.id === activeCharacterId);
    const nextIdx = idx < 0 || idx >= pool.length - 1 ? 0 : idx + 1;
    setActiveCharacterId(pool[nextIdx].id);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handleResetFilters = () => {
    setSelectedCreator('Tất cả');
    setSelectedTags([]);
    setSearchQuery('');
    setOnlyFavorites(false);
  };

  const handleGoHome = () => {
    setActiveCharacterId(null);
    setIsFormOpen(false);
    setIsCommandModalOpen(false);
    setIsDatingIdeasOpen(false);
    setIsHeartMenuOpen(false);
    setIsChocoCornerOpen(false);
    setIsDiaryOpen(false);
    setIsGameHubOpen(false);
    setEditingCharacter(null);
    setOnlyFavorites(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleGoHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. CHỨC NĂNG THÚ CƯNG CANH CỬA (Mèo lười ở góc dưới phải)
  const catQuotes = useMemo(
    () => [
      'Meo~ Đang ngủ mà, vuốt thêm đi! 😾',
      'Oáp... Choco đi vắng rồi, để cá lại đây! 🐟',
      'Meo meo! Đừng chọc trúng bụng nhen! 🐾',
    ],
    []
  );
  const [isCatAwake, setIsCatAwake] = useState(false);
  const [catBubbleText, setCatBubbleText] = useState('Zzz...');
  const catTimerRef = useRef<NodeJS.Timeout | null>(null);

  const wakeUpMascot = () => {
    if (catTimerRef.current) clearTimeout(catTimerRef.current);
    const randomQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
    setCatBubbleText(randomQuote);
    setIsCatAwake(true);

    catTimerRef.current = setTimeout(() => {
      setIsCatAwake(false);
      setCatBubbleText('Zzz...');
    }, 3000);
  };

  // 4. HIỆU ỨNG NHẤP CHUỘT (Thả tim 🤎)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('input')
      ) {
        return;
      }

      const heart = document.createElement('div');
      heart.className = 'click-heart';
      heart.innerText = '🤎';
      heart.style.left = `${e.clientX}px`;
      heart.style.top = `${e.clientY}px`;

      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1000);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // 5. HIỆU ỨNG MẬT MÃ BÍ MẬT (EASTER EGG: gõ phím "choco")
  const taoTimKhongGian = () => {
    const tim = document.createElement('div');
    tim.innerText = '🤎';
    tim.style.position = 'fixed';
    const startLeftVw = Math.random() * 100;
    tim.style.left = `${startLeftVw}vw`;
    tim.style.top = '110vh';
    tim.style.fontSize = `${Math.random() * 20 + 15}px`;
    tim.style.zIndex = '99999';
    tim.style.transition = 'all 2s ease-out';
    tim.style.pointerEvents = 'none';

    document.body.appendChild(tim);

    // Bắn tim lên trên
    window.setTimeout(() => {
      tim.style.top = '-10vh';
      tim.style.left = `${startLeftVw + (Math.random() * 10 - 5)}vw`;
      tim.style.opacity = '0';
      tim.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() * 1.5 + 0.5})`;
    }, 50);

    // Xóa tim sau khi bay xong
    window.setTimeout(() => tim.remove(), 2000);
  };

  useEffect(() => {
    const handleSecretPasscodeKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isFormOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const { nextBuffer, matched } = appendSecretPasscodeKey(
        chuoiGoPhipRef.current,
        e.key,
        'choco'
      );
      chuoiGoPhipRef.current = nextBuffer;

      if (matched) {
        // Nổ 30 tim rợp trời
        for (let i = 0; i < 30; i++) {
          window.setTimeout(taoTimKhongGian, i * 100);
        }
        // Hiện thông báo sau 500ms
        window.setTimeout(() => {
          setIsEasterEggAlertOpen(true);
        }, 500);
      }
    };

    document.addEventListener('keydown', handleSecretPasscodeKeyDown);
    return () => document.removeEventListener('keydown', handleSecretPasscodeKeyDown);
  }, []);

  // 6. HIỆU ỨNG CÔNG TẮC ĐÈN PIN (SPOTLIGHT)
  useEffect(() => {
    const handleSpotlightMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      if (isDarkSpotlightRef.current && darknessOverlayRef.current) {
        darknessOverlayRef.current.style.background = `radial-gradient(circle 150px at ${e.clientX}px ${e.clientY}px, transparent 0%, rgba(0, 0, 0, 0.98) 80%)`;
      }
    };

    document.addEventListener('mousemove', handleSpotlightMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleSpotlightMouseMove);
  }, []);

  const toggleSpotlight = () => {
    const nextDark = !isDarkSpotlightRef.current;
    isDarkSpotlightRef.current = nextDark;
    setIsDarkSpotlight(nextDark);

    const overlay = darknessOverlayRef.current;
    const { x: mouseX, y: mouseY } = mousePosRef.current;

    if (nextDark) {
      // TẮT ĐÈN
      document.body.classList.add('dark-mode');
      if (overlay) {
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        overlay.style.background = `radial-gradient(circle 150px at ${mouseX}px ${mouseY}px, transparent 0%, rgba(0, 0, 0, 0.98) 80%)`;
      }
    } else {
      // BẬT ĐÈN LẠI
      document.body.classList.remove('dark-mode');
      if (overlay) {
        overlay.style.opacity = '0';
        window.setTimeout(() => {
          if (!isDarkSpotlightRef.current && darknessOverlayRef.current) {
            darknessOverlayRef.current.style.visibility = 'hidden';
          }
        }, 500);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col text-[#FAFAFA] overflow-x-hidden transition-colors duration-700 bg-[#09090B]">
      {/* Magic Glowing Cursor */}
      <MagicCursor />

      {/* Dây kéo công tắc đèn (Spotlight) - gắn cố định ở đầu trang, không đi theo khi cuộn xuống */}
      <div
        className="light-switch"
        onClick={toggleSpotlight}
        role="button"
        tabIndex={0}
        aria-label={isDarkSpotlight ? 'Kéo để bật đèn' : 'Kéo để tắt đèn'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSpotlight();
          }
        }}
      >
        <div className="wire"></div>
        <div className="bulb"></div>
        <div className="switch-hint">
          {isDarkSpotlight ? 'Kéo để bật đèn' : 'Kéo để tắt đèn'}
        </div>
      </div>

      {/* Lớp phủ bóng tối (Mặc định tàng hình) */}
      <div id="darkness-overlay" ref={darknessOverlayRef} aria-hidden="true"></div>

      {/* 3. Thú cưng canh cửa (Mèo lười ở góc dưới phải) */}
      <div
        className="mascot"
        onClick={wakeUpMascot}
        role="button"
        tabIndex={0}
        aria-label="Thú cưng canh cửa Mèo lười"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            wakeUpMascot();
          }
        }}
      >
        <div
          className="chat-bubble"
          id="cat-bubble"
          style={{ opacity: isCatAwake ? 1 : 0 }}
        >
          {catBubbleText}
        </div>
        <div
          className="cat-icon"
          id="cat-body"
          style={{
            animation: isCatAwake ? 'none' : 'breathing 3s infinite ease-in-out',
          }}
        >
          🐈
        </div>
      </div>

      {/* Nút Mở Sổ (Góc dưới bên trái, ở trên đồng hồ) */}
      <div
        className="diary-trigger"
        role="button"
        tabIndex={0}
        onClick={() => setIsDiaryOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsDiaryOpen((prev) => !prev);
          }
        }}
        aria-label="Sổ Ký Ức"
        title="Sổ Ký Ức"
      >
        📖 <span className="diary-tooltip">Sổ Ký Ức</span>
      </div>

      {/* Đồng hồ Lofi góc trái bên dưới */}
      <LofiClock />

      {/* Twinkling Starfield Background (.star) + Gentle Falling Sparkles (.falling-item) */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,41,59,0.38)_0%,_rgba(9,9,11,0)_70%)]"
        aria-hidden="true"
        data-testid="starfield-container"
      >
        {STARFIELD_ITEMS.map((star) => (
          <span
            key={star.id}
            className="star"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: star.duration,
              animationDelay: star.delay,
            }}
          />
        ))}

        {FALLING_ITEMS.map((item) => (
          <span
            key={item.id}
            className="falling-item text-pink-300/40 select-none pointer-events-none"
            style={{
              left: item.left,
              animationDuration: item.duration,
              animationDelay: item.delay,
              width: `${item.size}px`,
              height: `${item.size}px`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z" />
            </svg>
          </span>
        ))}
      </div>

      {/* MÀN HÌNH CHÀO MỪNG (CLICK TO ENTER) */}
      {!hasEnteredLibrary && (
        <div
          id="welcome-screen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
          className={welcomeFadingOut ? 'fade-out' : ''}
        >
          <div
            className="welcome-content cursor-pointer p-6 sm:p-8 max-w-lg mx-auto"
            onClick={(e) => {
              e.stopPropagation();
              handleEnterFromWelcome();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEnterFromWelcome();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <h2 id="welcome-modal-title" className="welcome-text font-editorial font-bold">
              Chào mừng quý khách đến ngôi nhà nhỏ của Choco
            </h2>
            <p className="loading-text">
              Đang pha một chút bình yên...
            </p>
            <div className="loader-dot my-4"></div>
            <p className="enter-hint">[ Chạm vào màn hình để bước vào ]</p>
          </div>
        </div>
      )}

      {/* Top Bar with Top-Left Music Note + "Nhà nhỏ của Choco" and Top-Right Rounded Square Home Button */}
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 py-3.5 border-b border-[#27272A] bg-[#09090B]/95 sticky top-0 z-[60] backdrop-blur-xs">
        {/* Zone 1 (Top-Left Corner): Rounded Square Music Note Icon + "Nhà nhỏ của Choco" */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <AmbientMusicPlayer autoPlayTrigger={musicAutoPlayTrigger} />
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleGoHome();
            }}
            className="text-sm sm:text-xl font-editorial font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Nhà nhỏ của Choco
          </a>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-3.5 xl:gap-5 text-sm font-medium text-[#A1A1AA]"
        >
          <a
            href="#danh-sach-nhan-vat"
            onClick={() => {
              setActiveCharacterId(null);
              setIsCommandModalOpen(false);
              setOnlyFavorites(false);
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Danh mục hồ sơ
          </a>
          <a
            href="#tu-yeu-thich"
            onClick={() => {
              setActiveCharacterId(null);
              setIsCommandModalOpen(false);
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Yêu thích ({favoriteIds.length})
          </a>
          {allCharacters.length > 0 && (
            <button
              type="button"
              onClick={() => setIsRandomModalOpen(true)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Chọn ngẫu nhiên
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActiveCharacterId(null);
              setIsCommandModalOpen(false);
              setIsDatingIdeasOpen(false);
              setIsMultiverseView((prev) => !prev);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isMultiverseView
                ? 'text-pink-300 font-semibold underline underline-offset-4'
                : 'hover:text-white hover:underline underline-offset-4'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Đa vũ trụ</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono-num">
              Show & Open World
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCharacterId(null);
              setIsCommandModalOpen(false);
              setIsDatingIdeasOpen(false);
              setIsChocoCornerOpen(true);
            }}
            className={`hover:text-pink-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-pink-200/90 font-medium cursor-pointer ${
              isChocoCornerOpen ? 'text-pink-300 underline' : ''
            }`}
          >
            <span>☕ Góc nhỏ của Choco</span>
          </button>
        </nav>

        {/* Zone 3: Rounded Square Home Button + Rounded Square Heart Button + Primary Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveCharacterId(null);
              setIsCommandModalOpen(false);
              setIsDatingIdeasOpen(false);
              setIsChocoCornerOpen(true);
            }}
            className="md:hidden px-2 py-1.5 text-[11px] font-medium text-pink-200 bg-pink-500/15 border border-pink-500/30 rounded-xl hover:bg-pink-500/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            ☕ Góc Choco
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            aria-label="Về trang chủ"
            aria-describedby="home-button-tooltip"
            title="Về trang chủ (Alt + H)"
            className="group relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#141417] text-[#FAFAFA] border border-[#27272A] hover:border-[#71717A] hover:bg-[#18181B] flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0"
          >
            <Home className="w-4 h-4" />
            <span
              id="home-button-tooltip"
              role="tooltip"
              className="pointer-events-none absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[70] px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] text-xs font-medium whitespace-nowrap shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-150 flex items-center gap-1.5"
            >
              <span>Về trang chủ</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono-num bg-[#27272A] text-[#D4D4D8] rounded border border-[#3F3F46]">
                Alt + H
              </kbd>
            </span>
          </button>

          {/* Ô vuông hình rạp xiếc (Khu Vườn Trò Chơi / Minigame) cạnh hình ngôi nhà - biểu tượng không có màu */}
          <button
            type="button"
            id="nav-game-square-btn"
            onClick={() => setIsGameHubOpen(true)}
            aria-label="Khu Vườn Trò Chơi"
            title="Khu Vườn Trò Chơi (Minigame)"
            className={`group relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#141417] text-[#FAFAFA] border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
              isGameHubOpen
                ? 'border-[#FAFAFA]/60 bg-[#27272A]'
                : 'border-[#27272A] hover:border-[#71717A] hover:bg-[#18181B]'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="w-4 h-4 group-hover:scale-110 transition-transform"
            >
              {/* Lá cờ đỉnh rạp xiếc */}
              <path d="M12 2v4" />
              <path d="M12 2l3.5 1.5L12 5" />
              {/* Mái rạp xiếc */}
              <path d="M12 6L3 13h18L12 6z" />
              <path d="M12 6l-3.5 7" />
              <path d="M12 6l3.5 7" />
              {/* Thân rạp và rèm cửa mở */}
              <path d="M5 13v8h14v-8" />
              <path d="M12 13l-3 8" />
              <path d="M12 13l3 8" />
            </svg>
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[70] px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] text-xs font-medium whitespace-nowrap shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-150 flex items-center gap-1.5"
            >
              <span>Khu Vườn Trò Chơi</span>
            </span>
          </button>

          {/* Ô vuông hình trái tim: Bấm vào có 2 lựa chọn (Kho lệnh hoặc Idea hẹn hò) */}
          <div className="relative" ref={heartMenuRef}>
            <button
              type="button"
              id="heart-square-button"
              onClick={() => setIsHeartMenuOpen((prev) => !prev)}
              aria-label="Kho lệnh và Idea hẹn hò"
              aria-expanded={isHeartMenuOpen}
              aria-haspopup="true"
              title="Kho lệnh & Idea hẹn hò"
              className={`group relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#141417] border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
                isHeartMenuOpen || isCommandModalOpen || isDatingIdeasOpen
                  ? 'border-pink-500/60 bg-pink-500/15 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.25)]'
                  : 'text-[#FAFAFA] border-[#27272A] hover:border-pink-500/40 hover:bg-[#18181B] hover:text-pink-300'
              }`}
            >
              <Heart
                className={`w-4 h-4 text-pink-400 ${
                  isHeartMenuOpen || isCommandModalOpen || isDatingIdeasOpen
                    ? 'fill-pink-400'
                    : 'fill-pink-500/25'
                } group-hover:scale-110 group-hover:fill-pink-400 transition-all`}
              />
              {!isHeartMenuOpen && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[70] px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] text-xs font-medium whitespace-nowrap shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-150 flex items-center gap-1.5"
                >
                  <span>Kho lệnh & Idea hẹn hò</span>
                  <span className="text-[10px] text-pink-300">🤎</span>
                </span>
              )}
            </button>

            {/* Menu Popover with 2 choices */}
            {isHeartMenuOpen && (
              <div
                id="heart-dropdown-menu"
                role="menu"
                aria-label="Lựa chọn tiện ích"
                className="absolute top-full mt-2 right-0 w-64 sm:w-72 rounded-2xl bg-[#18181B] border border-pink-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.7)] p-2 z-[80] animate-fade-in"
              >
                <div className="px-3 py-2 border-b border-[#27272A] mb-1.5">
                  <div className="text-[11px] font-semibold tracking-wider text-pink-300 uppercase flex items-center gap-1.5">
                    <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                    <span>Tiện Ích Của Choco</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Chọn một mục để mở bảng tiện ích:
                  </p>
                </div>

                <div className="space-y-1">
                  {/* Lựa chọn 1: Kho lệnh */}
                  <button
                    type="button"
                    id="menu-choice-command-vault"
                    role="menuitem"
                    onClick={() => {
                      setIsHeartMenuOpen(false);
                      setIsDatingIdeasOpen(false);
                      setIsCommandModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#27272A] transition-all flex items-start gap-3 group cursor-pointer border border-transparent hover:border-[#3F3F46]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAFAFA] group-hover:text-amber-200 transition-colors">
                          Kho lệnh
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#27272A] text-[#A1A1AA] font-mono-num border border-[#3F3F46]">
                          {savedCommands.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5">
                        Câu lệnh prompt, OOC & nhập vai
                      </p>
                    </div>
                  </button>

                  {/* Lựa chọn 2: Idea hẹn hò */}
                  <button
                    type="button"
                    id="menu-choice-dating-ideas"
                    role="menuitem"
                    onClick={() => {
                      setIsHeartMenuOpen(false);
                      setIsCommandModalOpen(false);
                      setIsDatingIdeasOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-pink-500/10 transition-all flex items-start gap-3 group cursor-pointer border border-transparent hover:border-pink-500/30"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4 fill-pink-400/20 text-pink-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAFAFA] group-hover:text-pink-200 transition-colors">
                          Idea hẹn hò
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono-num border border-pink-500/30">
                          {datingIdeas.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5">
                        Ý tưởng ngọt ngào, quay ngẫu nhiên & kỷ niệm
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem(SESSION_KEY_ENTERED_LIBRARY);
                sessionStorage.removeItem(SESSION_KEY_FORM_OPEN);
              } catch {
                // Ignore
              }
              setHasEnteredLibrary(false);
            }}
            aria-label="Ra cửa chào mừng"
            title="Ra cửa chào mừng (Out)"
            className="hidden sm:flex group relative w-10 h-10 rounded-xl bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#27272A] hover:border-[#71717A] hover:bg-[#18181B] items-center justify-center transition-all duration-150 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[70] px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] text-xs font-medium whitespace-nowrap shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 transition-all duration-150 flex items-center gap-1.5"
            >
              <span>Màn hình chào mừng</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCharacterId(null);
              setEditingCharacter(null);
              setIsFormOpen(true);
            }}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-[#09090B] bg-white hover:bg-[#E4E4E7] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
            <span className="hidden sm:inline">nhân vật</span>
          </button>
        </div>
      </header>

      <main
        id="top"
        className="relative z-10 flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-12 pt-10 pb-8 sm:pt-14 sm:pb-12 space-y-14"
      >
        {/* Split-Screen Editorial Hero (without the removed top kicker line) */}
        <section id="tieu-diem" aria-label="Nhân vật tiêu điểm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Editorial Typographic Hierarchy */}
            <div className="lg:col-span-7 flex flex-col justify-between py-2">
              <div className="space-y-5">
                <h1
                  className="text-4xl sm:text-5xl lg:text-[54px] font-editorial font-bold text-white leading-[1.08] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Anh Tí, anh Tèo anh nào em cũng quý
                </h1>

                <p className="text-base text-[#A1A1AA] max-w-2xl leading-relaxed min-h-[1.75rem]">
                  {typedSubtitle}
                </p>
              </div>

              {/* Featured Spotlight Preview Box (.glass-box .card-shine) - Only shows when picked ("chưa pick thì chưa hiện") */}
              {houseFavoriteCharacter ? (
                <div
                  className="glass-box card-shine mt-8 p-6 space-y-3"
                  onMouseMove={handleCardMouseMove}
                >
                  <div className="space-y-1 text-xs text-zinc-100 mb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-white glow-text tracking-wide flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-current text-pink-300 pulse-icon" />
                        <span>Thành viên trong ngôi nhà nhỏ được yêu thích nhất</span>
                      </span>
                      <span>
                        Creator:{' '}
                        <strong className="text-white font-mono-num">
                          {houseFavoriteCharacter.creatorHandle}
                        </strong>
                      </span>
                    </div>
                    <div className="text-white">
                      <span className="text-zinc-100 font-medium">Tags: </span>
                      {houseFavoriteCharacter.tags.map((t) => `#${t}`).join(' · ')}
                    </div>
                  </div>

                  <div className="text-2xl font-editorial font-bold text-white flex items-center gap-2">
                    <span>{houseFavoriteCharacter.name}</span>
                    {isCharacterNew(houseFavoriteCharacter) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/90 text-white shadow-md border border-rose-300/50 backdrop-blur-xs animate-pulse">
                        Mới (New)
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-100 mt-2 line-clamp-2">
                    {houseFavoriteCharacter.backstory[0]}
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveCharacterId(houseFavoriteCharacter.id)}
                        className="link-button px-4 py-2.5 text-[#09090B] text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Xem hồ sơ {houseFavoriteCharacter.name}</span>
                      </button>
                      <a
                        href={houseFavoriteCharacter.characterLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-button px-4 py-2.5 text-[#09090B] text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5"
                      >
                        <span>Link nhân vật</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#09090B]" />
                      </a>
                    </div>

                    <div className="text-[11px] text-pink-200/90 flex items-center gap-1 italic">
                      <Heart className="w-3 h-3 fill-current text-pink-300" />
                      <span>Em thương anh nhất mà</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-box mt-8 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-base font-editorial font-bold text-white flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      <span>Chưa chọn thành viên yêu thích nhất</span>
                    </div>
                    <p className="text-xs text-zinc-100 max-w-md">
                      Mở hồ sơ nhân vật bất kỳ và ấn nút &ldquo;Em thương anh nhất mà&rdquo; để anh ấy trở thành thành viên được yêu thích nhất và xuất hiện tại đây nha!
                    </p>
                  </div>
                  <a
                    href="#danh-sach-nhan-vat"
                    className="link-button px-4 py-2.5 text-[#09090B] text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Xem danh sách các anh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Featured Visual Portrait Container (.floating-img) */}
            <div className="lg:col-span-5 py-3">
              {houseFavoriteCharacter ? (
                <div
                  onClick={() => setActiveCharacterId(houseFavoriteCharacter.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveCharacterId(houseFavoriteCharacter.id);
                    }
                  }}
                  aria-label={`Mở hồ sơ chi tiết của ${houseFavoriteCharacter.name}`}
                  className="group relative h-full min-h-[380px] cursor-pointer"
                >
                  <div className="floating-img relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden">
                    {/* Tag 'Mới' (New) on hero portrait */}
                    {isCharacterNew(houseFavoriteCharacter) && (
                      <span className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-rose-500/90 text-white shadow-lg border border-rose-300/50 backdrop-blur-xs flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span>Mới (New)</span>
                      </span>
                    )}
                    <CharacterArtwork
                      character={houseFavoriteCharacter}
                      className="w-full h-full transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-white">
                      <div className="text-xs text-[#D4D4D8] mb-1">
                        {houseFavoriteCharacter.code} · Creator: {houseFavoriteCharacter.creatorHandle}
                      </div>
                      <div className="text-3xl font-editorial font-bold">
                        {houseFavoriteCharacter.name}
                      </div>
                      <div className="text-xs text-[#A1A1AA] mt-1 mb-3">
                        {houseFavoriteCharacter.tags.map((t) => `#${t}`).join(' · ')}
                      </div>
                      {houseFavoriteCharacter.personalityNotes && (
                        <div className="p-3.5 rounded-xl bg-black/60 backdrop-blur-xs border border-white/15 text-xs text-zinc-100 line-clamp-2 italic font-editorial text-[15px]">
                          {houseFavoriteCharacter.personalityNotes}
                        </div>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                        <span>Nhấp để đọc Backstory, Tin nhắn mở đầu & Link</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setEditingCharacter(null);
                    setIsFormOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setEditingCharacter(null);
                      setIsFormOpen(true);
                    }
                  }}
                  className="h-full min-h-[320px] rounded-2xl border border-dashed border-[#27272A] hover:border-[#71717A] bg-[#121215]/70 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-white mb-4">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-editorial font-bold text-white">
                    Tạo hồ sơ nhân vật mới
                  </div>
                  <p className="text-xs text-[#A1A1AA] max-w-xs mt-1.5 leading-relaxed">
                    Thêm Tên nhân vật, Creator, Nhãn (Tags), Backstory, Tin nhắn mở đầu và Link
                    nhân vật.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ĐA VŨ TRỤ: CÁC SHOW VÀ OPEN WORLD */}
        {isMultiverseView && (
          <MultiverseSection
            shows={shows}
            openWorlds={openWorlds}
            onAddShow={handleAddShow}
            onUpdateShow={handleUpdateShow}
            onDeleteShow={handleDeleteShow}
            onAddOpenWorld={handleAddOpenWorld}
            onUpdateOpenWorld={handleUpdateOpenWorld}
            onDeleteOpenWorld={handleDeleteOpenWorld}
            onClose={() => setIsMultiverseView(false)}
          />
        )}

        {/* Dedicated Favorites Quick-Access Section (without preset user options) */}
        <section
          id="tu-yeu-thich"
          aria-labelledby="favorites-heading"
          className="p-6 sm:p-8 rounded-2xl bg-[#121215] border border-[#27272A] space-y-4"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#27272A] pb-4">
            <h2
              id="favorites-heading"
              className="text-2xl sm:text-3xl font-editorial font-bold text-white tracking-tight"
            >
              Tủ Hồ Sơ Yêu Thích ({favoriteCharacters.length})
            </h2>
          </div>

          {favoriteCharacters.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#A1A1AA]">
              Chưa có nhân vật yêu thích nào được lưu. Nhấp vào biểu tượng trái tim trên hồ sơ nhân
              vật để thêm vào tủ yêu thích.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteCharacters.map((favChar) => (
                <div
                  key={favChar.id}
                  onMouseMove={handleCardMouseMove}
                  className="card-shine group border border-[#27272A] hover:border-[#71717A] rounded-xl p-3.5 flex items-center justify-between gap-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    onClick={() => setActiveCharacterId(favChar.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveCharacterId(favChar.id);
                      }
                    }}
                    aria-label={`Mở nhanh hồ sơ yêu thích ${favChar.name}`}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 spin-border">
                      <CharacterArtwork character={favChar} className="w-full h-full rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-[#D4D4D8] font-mono-num truncate">
                        {favChar.creatorHandle}
                      </div>
                      <div className="text-base font-editorial font-bold text-white truncate group-hover:text-[#D4D4D8] transition-colors">
                        {favChar.name}
                      </div>
                      <div className="text-xs text-[#71717A] truncate">
                        {favChar.tags.map((t) => `#${t}`).join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveCharacterId(favChar.id)}
                      className="px-2.5 py-1.5 bg-white hover:bg-[#E4E4E7] text-[#09090B] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Hồ sơ
                    </button>
                    <a
                      href={favChar.characterLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Mở link nhân vật yêu thích ${favChar.name}`}
                      className="p-1.5 bg-[#09090B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(favChar.id)}
                      aria-label={`Bỏ yêu thích ${favChar.name}`}
                      className="p-1.5 text-pink-400 hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current pulse-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Character Roster & Creator / Tag Search Console */}
        <section id="danh-sach-nhan-vat" aria-labelledby="roster-heading" className="space-y-6">
          <div
            id="bo-loc-tim-kiem"
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#27272A] pb-5"
          >
            <div>
              <h2
                id="roster-heading"
                className="text-3xl font-editorial font-bold text-white tracking-tight"
              >
                Danh mục & Bộ lọc Nhân vật
              </h2>
              <p className="text-sm text-[#A1A1AA] mt-1">
                Tìm kiếm theo tên nhân vật, lọc theo Creator (Tác giả) hoặc Nhãn (Tags).
              </p>
            </div>

            {/* Keyword Search Bar & Multiverse Toggle */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <div className="relative w-full sm:w-[300px]">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên nhân vật, creator, tag..."
                  aria-label="Tìm kiếm nhân vật theo từ khóa"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#121215] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMultiverseView((prev) => !prev)}
                className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isMultiverseView
                    ? 'bg-pink-500 text-white border-pink-400'
                    : 'bg-[#121215] hover:bg-[#18181B] text-[#E4E4E7] border-[#27272A]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Đa vũ trụ</span>
              </button>
            </div>
          </div>

          {/* Creator & Tag Filter Console */}
          <div className="p-5 rounded-2xl bg-[#121215] border border-[#27272A] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Creator Filter Buttons */}
              <div
                role="group"
                aria-label="Lọc theo Creator"
                className="flex flex-wrap items-center gap-1.5"
              >
                <span className="text-xs text-[#71717A] mr-1">Creator:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCreator('Tất cả')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCreator === 'Tất cả'
                      ? 'bg-white text-[#09090B] font-semibold'
                      : 'bg-[#18181B] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Tất cả Creator
                </button>
                {availableCreators.map((creator) => (
                  <button
                    key={creator}
                    type="button"
                    onClick={() =>
                      setSelectedCreator((prev) => (prev === creator ? 'Tất cả' : creator))
                    }
                    className={`px-3 py-1.5 text-xs font-mono-num rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCreator === creator
                        ? 'bg-white text-[#09090B] font-semibold'
                        : 'bg-[#18181B] text-[#A1A1AA] hover:text-white hover:bg-[#27272A]'
                    }`}
                  >
                    {creator}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOnlyFavorites((prev) => !prev)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  onlyFavorites
                    ? 'bg-white text-[#09090B] border-white font-semibold'
                    : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
                <span>Chỉ hiện yêu thích ({favoriteIds.length})</span>
              </button>
            </div>

            {/* Interactive Tag Filter Buttons alongside Creator info */}
            <div className="pt-3 border-t border-[#27272A] flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Lọc theo nhãn (Tags)"
              >
                <span className="text-xs text-[#71717A] mr-1">Nhãn (Tags):</span>
                {availableTags.length === 0 ? (
                  <span className="text-xs text-[#52525B]">
                    Các tag sẽ xuất hiện tại đây khi bạn thêm nhân vật
                  </span>
                ) : (
                  availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        aria-pressed={isSelected}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#09090B] font-semibold'
                            : 'bg-[#18181B] text-[#A1A1AA] hover:text-white hover:bg-[#27272A]'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#A1A1AA] shrink-0">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Xóa bộ lọc ({activeFilterCount})</span>
                  </button>
                )}
                <span>
                  Hiển thị{' '}
                  <span className="font-mono-num text-white">
                    {filteredCharacters.length} / {allCharacters.length}
                  </span>{' '}
                  hồ sơ
                </span>
              </div>
            </div>
          </div>

          {/* 3-Column Interactive Character Roster Grid */}
          {allCharacters.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#121215] border border-[#27272A] space-y-3">
              <div className="text-xl font-editorial font-bold text-white">
                Danh sách nhân vật đang trống
              </div>
              <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
                Chưa có nhân vật hay Creator nào. Nhấn vào nút bên dưới để thêm hồ sơ nhân vật đầu
                tiên vào Nhà nhỏ của Choco.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCharacter(null);
                    setIsFormOpen(true);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold bg-white text-[#09090B] rounded-xl hover:bg-[#E4E4E7] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm nhân vật mới</span>
                </button>
              </div>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#121215] border border-[#27272A] space-y-3">
              <div className="text-xl font-editorial font-bold text-white">
                Không tìm thấy hồ sơ nhân vật phù hợp
              </div>
              <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
                Không có nhân vật nào khớp với từ khóa, creator hoặc nhãn (tag) đang chọn.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-xs font-semibold bg-white text-[#09090B] rounded-xl hover:bg-[#E4E4E7] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((char) => {
                const isFav = favoriteIds.includes(char.id);
                return (
                  <article
                    key={char.id}
                    onMouseMove={handleCardMouseMove}
                    className="card-shine group border border-[#27272A] hover:border-[#A1A1AA] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-2xl"
                  >
                    <div>
                      {/* Clickable Portrait Header with Interactive Hover Reveal Overlay */}
                      <div
                        onClick={() => setActiveCharacterId(char.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveCharacterId(char.id);
                          }
                        }}
                        aria-label={`Xem hồ sơ nhân vật ${char.name}`}
                        className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer"
                      >
                        <CharacterArtwork
                          character={char}
                          className="w-full h-full transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                        />

                        {/* Tag 'Mới' (New) on card portrait if added within last 12h */}
                        {isCharacterNew(char) && (
                          <span className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/90 text-white shadow-lg border border-rose-300/50 backdrop-blur-xs flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            <span>Mới (New)</span>
                          </span>
                        )}

                        {/* Hover-activated quick dossier preview overlay */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 text-white">
                          <div className="flex items-center justify-between text-[11px] text-[#D4D4D8] font-medium">
                            <span>Creator: {char.creatorHandle}</span>
                            <span>{char.platformName}</span>
                          </div>
                          <div className="my-auto py-2" data-testid="card-hover-note">
                            <p className="text-sm italic font-editorial text-zinc-100 line-clamp-3 leading-relaxed">
                              {char.personalityNotes}
                            </p>
                          </div>
                          <div className="text-[11px] font-semibold text-white flex items-center justify-between pt-2 border-t border-white/15">
                            <span>Nhấp để xem Tên, Backstory, Mở đầu & Link</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Default Resting Overlay Title */}
                        <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-end justify-between text-white group-hover:opacity-0 transition-opacity duration-150">
                          <div>
                            <div className="text-[11px] text-[#D4D4D8] font-mono-num">
                              {char.code} · {char.creatorHandle}
                            </div>
                            <h3 className="text-2xl font-editorial font-bold leading-tight">
                              {char.name}
                            </h3>
                          </div>
                          <span className="p-2 rounded-full bg-black/55 border border-white/15 text-white">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>

                      {/* Card Body: Separate Creator line, Separate Tags line + Backstory + Opening Message + Link */}
                      <div className="p-5 space-y-3">
                        {/* Separate Creator line & Separate Tags line + Favorite Button */}
                        <div className="flex items-start justify-between gap-2 text-xs text-[#A1A1AA]">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="truncate">
                              <span className="text-[#71717A]">Creator: </span>
                              <span className="font-semibold text-white font-mono-num">
                                {char.creatorHandle}
                              </span>
                            </div>
                            <div className="truncate text-[#D4D4D8]">
                              <span className="text-[#71717A]">Tags: </span>
                              <span>
                                {char.tags.map((tag, idx) => (
                                  <React.Fragment key={tag}>
                                    {idx > 0 && <span aria-hidden="true"> · </span>}
                                    <span>#{tag}</span>
                                  </React.Fragment>
                                ))}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(char.id)}
                            aria-label={isFav ? `Bỏ lưu ${char.name}` : `Lưu ${char.name}`}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              isFav
                                ? 'text-pink-400 bg-[#27272A]'
                                : 'text-[#71717A] hover:text-pink-300 hover:bg-[#18181B]'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current pulse-icon' : ''}`} />
                          </button>
                        </div>

                        {/* Backstory Preview */}
                        <div className="text-xs text-[#D4D4D8] leading-relaxed line-clamp-2">
                          <span className="font-semibold text-white">Backstory: </span>
                          {char.backstory[0]}
                        </div>

                        {/* Opening Message Preview */}
                        <div className="p-3 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-[#A1A1AA] line-clamp-2 group-hover:border-[#52525B] transition-colors">
                          <span className="font-semibold text-white not-italic">
                            Tin nhắn mở đầu:{' '}
                          </span>
                          <span className="italic font-editorial text-sm text-[#E4E4E7]">
                            {char.openingMessage.split('\n')[0]}
                          </span>
                        </div>

                        {/* Direct Character URL Line - Shortened */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] font-mono-num truncate pt-0.5">
                          <Link2 className="w-3.5 h-3.5 shrink-0 text-[#A1A1AA]" />
                          <span className="truncate" title={char.characterLink}>{shortenLinkDisplay(char.characterLink)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#18181B] flex items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveCharacterId(char.id)}
                        className="link-button flex-1 py-2.5 px-3.5 text-[#09090B] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Mở hồ sơ chi tiết</span>
                      </button>

                      <a
                        href={char.characterLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Truy cập link nhân vật ${char.name}`}
                        className="link-button py-2.5 px-3 text-[#09090B] text-xs font-semibold rounded-xl flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>Link</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#09090B]" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="relative z-10 border-t border-[#27272A] bg-[#09090B]/90 py-6 px-6 lg:px-12 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div>
            Nhà nhỏ của Choco - Nơi gửi gắm tình yêu
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsChocoCornerOpen(true)}
              className="hover:text-white underline underline-offset-4 cursor-pointer text-pink-300"
            >
              Góc nhỏ của Choco
            </button>
            <button
              type="button"
              onClick={() => setIsCommandModalOpen(true)}
              className="hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Kho lệnh
            </button>
            <button
              type="button"
              onClick={() => setHasEnteredLibrary(false)}
              className="hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Màn hình chào mừng
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCharacter(null);
                setIsFormOpen(true);
              }}
              className="hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Thêm nhân vật mới
            </button>
          </div>
        </div>
      </footer>

      {/* Mini-Page Modal for "Kho lệnh" ("LỆNH NÀY LỆNH KIA") */}
      {isCommandModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 pt-16 sm:pt-20 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-vault-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCommandModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col text-[#FAFAFA]">
            {/* Top Bar of Kho Lệnh Mini-Page */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#27272A] bg-[#18181B] shrink-0">
              <div className="text-xs font-medium text-[#A1A1AA] tracking-wide">
                KHO LỆNH · NHÀ NHỎ CỦA CHOCO
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGoHome}
                  aria-label="Về trang chủ từ kho lệnh"
                  title="Về trang chủ"
                  className="w-9 h-9 rounded-xl bg-[#09090B] border border-[#27272A] text-[#FAFAFA] hover:border-[#71717A] hover:bg-[#27272A] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCommandModalOpen(false)}
                  aria-label="Đóng kho lệnh"
                  className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body of Kho Lệnh Mini-Page */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="text-center space-y-2 border-b border-[#27272A] pb-6">
                <h2
                  id="command-vault-title"
                  className="text-3xl sm:text-4xl font-editorial font-bold text-white tracking-tight"
                >
                  LỆNH NÀY LỆNH KIA
                </h2>
                <p className="text-base text-[#A1A1AA] leading-relaxed">
                  Mong khó khăn của bé anh sẽ sửa được
                </p>
              </div>

              {/* Add / Edit command form */}
              <form
                onSubmit={handleAddCommand}
                className="p-4 sm:p-5 rounded-xl bg-[#09090B] border border-[#27272A] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-[#E4E4E7]">
                    {editingCommandId ? 'Chỉnh sửa câu lệnh' : 'Thêm lệnh mới vào kho lưu trữ'}
                  </div>
                  {editingCommandId && (
                    <button
                      type="button"
                      onClick={handleCancelEditCommand}
                      className="text-xs text-[#A1A1AA] hover:text-white underline cursor-pointer"
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={commandTitle}
                    onChange={(e) => setCommandTitle(e.target.value)}
                    placeholder="Tên lệnh (VD: Lệnh giữ tính cách nhân vật / Lệnh viết dài...)"
                    aria-label="Tên lệnh"
                    className="w-full px-3.5 py-2 text-xs bg-[#121215] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
                  />
                  <textarea
                    rows={3}
                    value={commandContent}
                    onChange={(e) => setCommandContent(e.target.value)}
                    placeholder="Nội dung câu lệnh (prompt / OOC / chỉ dẫn nhập vai)..."
                    aria-label="Nội dung câu lệnh"
                    className="w-full px-3.5 py-2 text-xs bg-[#121215] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-white hover:bg-[#E4E4E7] text-[#09090B] rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingCommandId ? 'Lưu thay đổi lệnh' : 'Lưu lệnh'}</span>
                  </button>
                </div>
              </form>

              {/* Saved commands list */}
              {savedCommands.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#71717A]">
                  Chưa có câu lệnh nào được lưu. Bạn có thể thêm các lệnh bên trên để sao chép
                  nhanh bất cứ lúc nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedCommands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">{cmd.title}</div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyCommand(cmd.id, cmd.content)}
                            className="px-2.5 py-1 text-xs font-medium bg-[#09090B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCommandId === cmd.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditCommand(cmd)}
                            aria-label={`Sửa lệnh ${cmd.title}`}
                            className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCommand(cmd.id)}
                            aria-label={`Xóa lệnh ${cmd.title}`}
                            className="p-1.5 text-[#A1A1AA] hover:text-red-400 hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#D4D4D8] leading-relaxed whitespace-pre-wrap break-words bg-[#09090B] p-3 rounded-lg border border-[#27272A]">
                        {cmd.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Character Profile Dossier Modal (Name, Creator, Backstory, Opening Message, Link) */}
      <ProfileModal
        character={activeCharacter}
        onClose={() => setActiveCharacterId(null)}
        onGoHome={handleGoHome}
        onSelectPrevious={handleSelectPrevious}
        onSelectNext={handleSelectNext}
        isFavorite={activeCharacter ? favoriteIds.includes(activeCharacter.id) : false}
        onToggleFavorite={handleToggleFavorite}
        isHouseFavorite={activeCharacter ? activeCharacter.id === houseFavoriteId : false}
        onSetHouseFavorite={handleSetHouseFavorite}
        onEditCharacter={(char) => {
          setActiveCharacterId(null);
          setEditingCharacter(char);
          setIsFormOpen(true);
        }}
        onDeleteCharacter={handleDeleteCharacter}
        totalCount={allCharacters.length}
        currentIndex={activeCharacterIndex >= 0 ? activeCharacterIndex : 0}
      />

      {/* Add / Edit Character Modal */}
      <CharacterFormModal
        isOpen={isFormOpen}
        editingCharacter={editingCharacter}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCharacter(null);
        }}
        onSave={handleSaveCharacter}
      />

      {/* Random Picker Modal ("Hôm nay bé sẽ hẹn hò cùng ai?") */}
      <RandomPickerModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        characters={allCharacters}
        onSelectCharacter={(id) => {
          setActiveCharacterId(id);
          setIsRandomModalOpen(false);
        }}
      />

      {/* Standalone Notification Modal: Góc Nhỏ Của Choco */}
      <ChocoCorner
        isOpen={isChocoCornerOpen}
        onClose={() => setIsChocoCornerOpen(false)}
        onGoHome={handleGoHome}
        characters={allCharacters}
      />

      {/* Dating Ideas Modal ("Idea hẹn hò") */}
      <DatingIdeasModal
        isOpen={isDatingIdeasOpen}
        onClose={() => setIsDatingIdeasOpen(false)}
        onGoHome={handleGoHome}
        ideas={datingIdeas}
        onAddIdea={handleAddDatingIdea}
        onUpdateIdea={handleUpdateDatingIdea}
        onDeleteIdea={handleDeleteDatingIdea}
        onToggleCompleted={handleToggleCompleteDatingIdea}
      />

      {/* Sổ Tay Ký Ức Modal */}
      <MemoryDiaryModal
        isOpen={isDiaryOpen}
        onClose={() => setIsDiaryOpen(false)}
        memories={memories}
        onSaveMemory={handleSaveMemory}
        onDeleteMemory={handleDeleteMemory}
        onRestoreMemories={handleRestoreMemories}
      />

      {/* Khu Vườn Trò Chơi (Minigame Hub) Modal */}
      <GameHubModal
        isOpen={isGameHubOpen}
        onClose={() => setIsGameHubOpen(false)}
        onRestoreMemories={handleRestoreMemories}
      />

      {/* Easter Egg ("choco") Secret Passcode Celebration Alert Modal */}
      {isEasterEggAlertOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="easter-egg-alert-title"
          onClick={() => setIsEasterEggAlertOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#3a2620] to-[#1f1410] border border-[#e8d0bd]/45 p-6 text-center shadow-2xl space-y-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl">🤎✨</div>
            <h3
              id="easter-egg-alert-title"
              className="font-editorial text-xl font-bold text-[#fdf6e3]"
            >
              Mật Mã Ẩn Của Choco
            </h3>
            <p className="text-sm text-[#e8d0bd] leading-relaxed whitespace-pre-line">
              {
                '✨ BÙM! Cậu đã tìm ra mật mã ẩn của trang web!\nPhần thưởng là... một tỷ lời chúc vui vẻ từ Choco nha! 🤎'
              }
            </p>
            <button
              type="button"
              onClick={() => setIsEasterEggAlertOpen(false)}
              className="magic-btn px-6 py-2 text-sm cursor-pointer"
            >
              Nhận một tỷ lời chúc 🤎
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
