import type {
  CharacterFilterOptions,
  CharacterFormInput,
  CharacterProfile,
  UserProfilePreference,
  ValidationResult,
} from '../types/character.ts';

export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export function filterCharacters(
  characters: CharacterProfile[],
  options: CharacterFilterOptions
): CharacterProfile[] {
  const {
    selectedCreator = 'Tất cả',
    selectedTags = [],
    searchQuery,
    onlyFavorites = false,
    favoriteIds = [],
  } = options;

  const normalizedQuery = normalizeVietnamese(searchQuery);

  const orderedCharacters = sortCharactersAlphabeticallyWithNewFirst(characters);

  const filtered = orderedCharacters.filter((char) => {
    if (onlyFavorites && !favoriteIds.includes(char.id)) {
      return false;
    }

    if (
      selectedCreator &&
      selectedCreator !== 'Tất cả' &&
      normalizeVietnamese(char.creatorHandle) !== normalizeVietnamese(selectedCreator)
    ) {
      return false;
    }

    if (selectedTags.length > 0) {
      const charTagsNorm = char.tags.map(normalizeVietnamese);
      const hasAllTags = selectedTags.every((t) =>
        charTagsNorm.includes(normalizeVietnamese(t))
      );
      if (!hasAllTags) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableFields = [
      char.name,
      char.birthday || '',
      char.age || '',
      char.zodiac || '',
      char.personality || '',
      char.personalityNotes || '',
      char.tags.join(' '),
      char.creatorHandle,
      char.shortHook,
      char.backstory.join(' '),
      char.openingMessage,
      char.platformName,
      char.code,
    ]
      .map(normalizeVietnamese)
      .join(' ');

    return searchableFields.includes(normalizedQuery);
  });

  return filtered;
}

export function formatMemberCode(index: number): string {
  const safeIndex = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  return `TV-${String(safeIndex + 1).padStart(2, '0')}`;
}

export function synchronizeCharacterCodes(characters: CharacterProfile[]): CharacterProfile[] {
  return characters.map((char, index) => ({
    ...char,
    code: formatMemberCode(index),
  }));
}

export function sortCharactersAlphabeticallyWithNewFirst(
  characters: CharacterProfile[],
  now: number = Date.now()
): CharacterProfile[] {
  const newChars: CharacterProfile[] = [];
  const olderChars: CharacterProfile[] = [];

  for (const c of characters) {
    if (isCharacterNew(c, now)) {
      newChars.push(c);
    } else {
      olderChars.push(c);
    }
  }

  const collator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });
  newChars.sort((a, b) => collator.compare(a.name, b.name));
  olderChars.sort((a, b) => collator.compare(a.name, b.name));

  return synchronizeCharacterCodes([...newChars, ...olderChars]);
}

export function extractUniqueAttributes(characters: CharacterProfile[]): {
  tags: string[];
  creators: string[];
} {
  const tagSet = new Set<string>();
  const creatorSet = new Set<string>();

  for (const char of characters) {
    if (char.creatorHandle) creatorSet.add(char.creatorHandle);
    for (const tag of char.tags || []) {
      if (tag) tagSet.add(tag);
    }
  }

  return {
    tags: Array.from(tagSet),
    creators: Array.from(creatorSet),
  };
}

export function toggleUserFavorite(
  profiles: UserProfilePreference[],
  activeUserId: string,
  characterId: string
): UserProfilePreference[] {
  return profiles.map((profile) => {
    if (profile.id !== activeUserId) return profile;
    const exists = profile.favoriteCharacterIds.includes(characterId);
    const updated = exists
      ? profile.favoriteCharacterIds.filter((id) => id !== characterId)
      : [...profile.favoriteCharacterIds, characterId];
    return {
      ...profile,
      favoriteCharacterIds: updated,
    };
  });
}

const newUrlHelper = URL;

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new newUrlHelper(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseTagsInput(tagsText: string): string[] {
  return tagsText
    .split(/[,;#]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function validateCharacterForm(input: CharacterFormInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Vui lòng nhập tên nhân vật (ít nhất 2 ký tự).';
  }

  if (!input.backstoryText || input.backstoryText.trim().length < 20) {
    errors.backstoryText = 'Backstory cần ít nhất 20 ký tự để mô tả tiểu sử nhân vật.';
  }

  if (!input.openingMessage || input.openingMessage.trim().length < 15) {
    errors.openingMessage = 'Tin nhắn mở đầu cần ít nhất 15 ký tự.';
  }

  if (!isValidHttpUrl(input.characterLink)) {
    errors.characterLink = 'Link nhân vật phải bắt đầu bằng https:// hoặc http:// hợp lệ.';
  }

  if (input.customAvatarUrl && input.customAvatarUrl.trim().length > 0) {
    if (!isValidHttpUrl(input.customAvatarUrl)) {
      errors.customAvatarUrl = 'Link ảnh đại diện phải là URL http:// hoặc https:// hợp lệ.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const NEW_CHARACTER_DURATION_MS = 12 * 60 * 60 * 1000;

export function normalizeCharacterTimestamps(char: CharacterProfile): CharacterProfile {
  if (!char || typeof char !== 'object') return char;

  // Built-in initial character Lục Thừa Dã was not newly added; if an edit previously set createdAt, move it to updatedAt
  if (char.id === 'char-luc-thua-da') {
    if (char.createdAt !== undefined) {
      const { createdAt, ...rest } = char;
      return {
        ...rest,
        updatedAt: Math.max(char.updatedAt ?? 0, typeof createdAt === 'number' ? createdAt : 0) || undefined,
      };
    }
    return char;
  }

  // Custom characters have their exact creation timestamp encoded in `char-custom-<timestamp>`
  if (typeof char.id === 'string' && char.id.startsWith('char-custom-')) {
    const rawTs = Number(char.id.slice('char-custom-'.length));
    if (Number.isFinite(rawTs) && rawTs > 0) {
      if (typeof char.createdAt === 'number' && char.createdAt > rawTs + 5000) {
        return {
          ...char,
          createdAt: rawTs,
          updatedAt: Math.max(char.updatedAt ?? 0, char.createdAt),
        };
      }
      if (char.createdAt === undefined) {
        return {
          ...char,
          createdAt: rawTs,
        };
      }
    }
  }

  return char;
}

export function isCharacterNew(char: CharacterProfile, now: number = Date.now()): boolean {
  const normalized = normalizeCharacterTimestamps(char);
  if (!normalized.createdAt) return false;
  return now - normalized.createdAt < NEW_CHARACTER_DURATION_MS && now >= normalized.createdAt;
}

export function shortenLinkDisplay(url: string, startChars = 32, endChars = 24): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.length <= startChars + endChars + 4) return trimmed;
  return `${trimmed.slice(0, startChars)}....${trimmed.slice(-endChars)}`;
}

export function buildCharacterFromInput(
  input: CharacterFormInput,
  existingIndex: number,
  existingId?: string,
  existingCreatedAt?: number,
  existingCharacter?: CharacterProfile | null
): CharacterProfile {
  const paragraphs = input.backstoryText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const parsedTags = parseTagsInput(input.tagsText);
  const rawCreator = input.creatorHandle.trim() || '@Creator';
  const normalizedCreator = rawCreator.startsWith('@') ? rawCreator : `@${rawCreator}`;

  const now = Date.now();
  const isUpdatingExisting = Boolean(existingId || existingCharacter);
  const normalizedBase = existingCharacter ? normalizeCharacterTimestamps(existingCharacter) : null;

  const resolvedId = existingId || normalizedBase?.id || `char-custom-${ existingCreatedAt ?? now }`;
  const resolvedCreatedAt = isUpdatingExisting
    ? existingCreatedAt ?? normalizedBase?.createdAt
    : existingCreatedAt ?? now;

  return normalizeCharacterTimestamps({
    id: resolvedId,
    code: formatMemberCode(existingIndex),
    name: input.name.trim(),
    birthday: input.birthday?.trim() || undefined,
    age: input.age?.trim() || undefined,
    zodiac: input.zodiac?.trim() || undefined,
    personality: input.personality?.trim() || undefined,
    tags: parsedTags.length > 0 ? parsedTags : ['Tự tạo'],
    shortHook:
      input.shortHook?.trim() ||
      normalizedBase?.shortHook ||
      paragraphs[0]?.slice(0, 140) ||
      input.openingMessage.trim().slice(0, 140),
    backstory: paragraphs.length > 0 ? paragraphs : [input.backstoryText.trim()],
    personalityNotes: input.personalityNotes.trim(),
    openingMessage: input.openingMessage.trim(),
    alternateGreetings: normalizedBase?.alternateGreetings,
    characterLink: input.characterLink.trim(),
    platformName: input.platformName.trim() || 'Character Hub',
    creatorHandle: normalizedCreator,
    avatarKey: normalizedBase?.avatarKey || 'custom',
    customAvatarUrl: input.customAvatarUrl?.trim() || undefined,
    accentHex: normalizedBase?.accentHex || '#E4E4E7',
    isCustom: true,
    ...(resolvedCreatedAt !== undefined ? { createdAt: resolvedCreatedAt } : {}),
    updatedAt: now,
  });
}

export function mergeAndSortCharacters(
  initialCharacters: ReadonlyArray<CharacterProfile>,
  customCharacters: ReadonlyArray<CharacterProfile>,
  deletedCharacterIds: ReadonlyArray<string> = [],
  now: number = Date.now()
): CharacterProfile[] {
  const deletedSet = new Set(deletedCharacterIds);
  const visibleCustom = customCharacters.filter((c) => !deletedSet.has(c.id));
  const customIds = new Set(visibleCustom.map((c) => c.id));
  const remainingInitials = initialCharacters.filter(
    (c) => !customIds.has(c.id) && !deletedSet.has(c.id)
  );
  return sortCharactersAlphabeticallyWithNewFirst([...visibleCustom, ...remainingInitials], now);
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function formatCharacterExportMarkdown(char: CharacterProfile): string {
  return [
    `# ${char.name}`,
    `- Mã hồ sơ: ${char.code}`,
    ...(char.birthday ? [`- Ngày sinh: ${char.birthday}`] : []),
    ...(char.age ? [`- Tuổi: ${char.age}`] : []),
    ...(char.zodiac ? [`- Cung: ${char.zodiac}`] : []),
    ...(char.personality ? [`- Tính cách: ${char.personality}`] : []),
    `- Creator: ${char.creatorHandle} (${char.platformName})`,
    `- Nhãn (Tags): ${char.tags.join(', ')}`,
    `- Link nhân vật: ${char.characterLink}`,
    '',
    '## Backstory (Tiểu sử)',
    ...char.backstory.map((p) => `${p}\n`),
    '## Tin nhắn mở đầu (Opening Message)',
    char.openingMessage,
  ].join('\n');
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateAudioProgressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  const ratio = (currentTime / duration) * 100;
  return Math.min(100, Math.max(0, ratio));
}

export function appendSecretPasscodeKey(
  currentBuffer: string,
  key: string,
  secretCode = 'choco'
): { nextBuffer: string; matched: boolean } {
  if (!key || key.length !== 1) {
    return { nextBuffer: currentBuffer, matched: false };
  }
  let nextBuffer = currentBuffer + key.toLowerCase();
  if (nextBuffer.length > secretCode.length) {
    nextBuffer = nextBuffer.substring(nextBuffer.length - secretCode.length);
  }
  if (nextBuffer === secretCode.toLowerCase()) {
    return { nextBuffer: '', matched: true };
  }
  return { nextBuffer, matched: false };
}

export function getNextTrackIndex(
  currentTrackId: string | null,
  tracks: ReadonlyArray<{ id: string }>
): number {
  if (tracks.length === 0) return -1;
  if (!currentTrackId) return 0;
  const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);
  if (currentIndex < 0) return 0;
  return (currentIndex + 1) % tracks.length;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function serializeHouseFavoriteForToday(
  characterId: string | null,
  now: Date = new Date()
): string | null {
  if (!characterId || !characterId.trim()) return null;
  return JSON.stringify({
    characterId: characterId.trim(),
    dateKey: getLocalDateKey(now),
  });
}

export function resolveValidHouseFavoriteId(
  rawStored: string | null,
  now: Date = new Date()
): string | null {
  if (!rawStored) return null;
  try {
    const parsed = JSON.parse(rawStored) as { characterId?: unknown; dateKey?: unknown };
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.characterId === 'string' &&
      parsed.characterId.trim().length > 0 &&
      typeof parsed.dateKey === 'string' &&
      parsed.dateKey === getLocalDateKey(now)
    ) {
      return parsed.characterId.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function getMsUntilNextMidnight(now: Date = new Date()): number {
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const diff = nextMidnight.getTime() - now.getTime();
  return diff > 0 ? diff : 1000;
}

export type MusicVibeType = 'light' | 'dark';

export function partitionTracksByVibe<T extends { id: string; type: MusicVibeType }>(
  tracks: ReadonlyArray<T>,
  vibeOverrides: Record<string, MusicVibeType> = {}
): { lightTracks: T[]; darkTracks: T[] } {
  const lightTracks: T[] = [];
  const darkTracks: T[] = [];

  for (const track of tracks) {
    const effectiveType = vibeOverrides[track.id] ?? track.type;
    if (effectiveType === 'light') {
      lightTracks.push({ ...track, type: 'light' });
    } else {
      darkTracks.push({ ...track, type: 'dark' });
    }
  }

  return { lightTracks, darkTracks };
}

export function formatLofiTime(now: Date = new Date()): {
  displayHours: string;
  displayMinutes: string;
  timeString: string;
  isSleepTime: boolean;
} {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const displayHours = hours < 10 ? '0' + hours : String(hours);
  const displayMinutes = minutes < 10 ? '0' + minutes : String(minutes);
  const timeString = `${displayHours}:${displayMinutes}`;
  const isSleepTime = hours >= 23 || hours <= 4;
  return { displayHours, displayMinutes, timeString, isSleepTime };
}

export function isDiscordUrlExpired(url: string, now: number = Date.now()): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.includes('discordapp.') && !url.includes('discord.')) return false;
  const match = url.match(/[?&]ex=([0-9a-fA-F]+)/);
  if (!match) return false;
  try {
    const expirySeconds = parseInt(match[1], 16);
    if (!Number.isFinite(expirySeconds)) return false;
    return now / 1000 > expirySeconds;
  } catch {
    return false;
  }
}

export function filterDatingIdeas<T extends { title: string; category: string; content: string }>(
  ideas: ReadonlyArray<T>,
  selectedCategory: string,
  searchQuery: string
): T[] {
  const query = searchQuery.trim().toLowerCase();
  const cat = selectedCategory.trim().toLowerCase();
  return ideas.filter((idea) => {
    const matchCategory =
      cat === 'tất cả' || idea.category.toLowerCase() === cat;
    const matchSearch =
      !query ||
      idea.title.toLowerCase().includes(query) ||
      idea.content.toLowerCase().includes(query) ||
      idea.category.toLowerCase().includes(query);
    return matchCategory && matchSearch;
  });
}

export function validateMemoryInput(
  character: string,
  quote: string
): { valid: boolean; error?: string } {
  if (!character.trim() || !quote.trim()) {
    return { valid: false, error: 'Cậu nhớ điền tên nhân vật và câu nói nhé!' };
  }
  return { valid: true };
}

export function createMemoryEntry(
  character: string,
  quote: string,
  thought: string,
  dateStr?: string
): { date: string; character: string; quote: string; thought: string } {
  return {
    date: dateStr || new Date().toLocaleString('vi-VN'),
    character: character.trim(),
    quote: quote.trim(),
    thought: thought.trim(),
  };
}

export function deleteMemoryEntry<T>(memories: ReadonlyArray<T>, index: number): T[] {
  return memories.filter((_, idx) => idx !== index);
}

export function mergeCustomCharacterLists(
  localList: ReadonlyArray<CharacterProfile>,
  serverList: ReadonlyArray<CharacterProfile>,
  deletedIds: ReadonlyArray<string> = [],
  preferServerOnConflict: boolean = false
): CharacterProfile[] {
  const deletedSet = new Set(deletedIds);
  const byId = new Map<string, CharacterProfile>();

  const primary = preferServerOnConflict ? localList : serverList;
  const secondary = preferServerOnConflict ? serverList : localList;

  for (const rawItem of primary) {
    if (rawItem && typeof rawItem.id === 'string' && !deletedSet.has(rawItem.id)) {
      const item = normalizeCharacterTimestamps(rawItem);
      byId.set(item.id, item);
    }
  }

  for (const rawItem of secondary) {
    if (rawItem && typeof rawItem.id === 'string' && !deletedSet.has(rawItem.id)) {
      const item = normalizeCharacterTimestamps(rawItem);
      const existing = byId.get(item.id);
      if (!existing) {
        byId.set(item.id, item);
      } else {
        const existingTime =
          typeof existing.updatedAt === 'number'
            ? existing.updatedAt
            : typeof existing.createdAt === 'number'
              ? existing.createdAt
              : 0;
        const incomingTime =
          typeof item.updatedAt === 'number'
            ? item.updatedAt
            : typeof item.createdAt === 'number'
              ? item.createdAt
              : 0;
        if (
          incomingTime >= existingTime ||
          secondary === (preferServerOnConflict ? serverList : localList)
        ) {
          const earliestCreatedAt =
            typeof existing.createdAt === 'number' && typeof item.createdAt === 'number'
              ? Math.min(existing.createdAt, item.createdAt)
              : existing.createdAt ?? item.createdAt;
          byId.set(
            item.id,
            normalizeCharacterTimestamps({
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

export function hasUnsyncedLocalCharacters(
  localList: ReadonlyArray<CharacterProfile>,
  serverList: ReadonlyArray<CharacterProfile>,
  deletedIds: ReadonlyArray<string> = []
): boolean {
  const deletedSet = new Set(deletedIds);
  const serverIds = new Set(
    serverList
      .filter((c) => c && typeof c.id === 'string')
      .map((c) => c.id)
  );

  for (const localChar of localList) {
    if (localChar && typeof localChar.id === 'string' && !deletedSet.has(localChar.id)) {
      if (!serverIds.has(localChar.id)) {
        return true;
      }
    }
  }
  return false;
}

export interface MatNguItem {
  cauDo: string;
  dapAn: ReadonlyArray<string>;
}

export const DANH_SACH_MAT_NGU: ReadonlyArray<MatNguItem> = [
  // --- HỆ CHIẾT TỰ CỔ PHONG ---
  {
    cauDo: `"Một lưỡi dao (Đao - 刀) sắc lẹm đặt kề ngay trên trái tim (Tâm - 心).<br>Dù đớn đau rớm máu nhưng vẫn lặng im không một lời oán thán. Đó là chữ gì?"`,
    dapAn: ['nhẫn', 'nhan'],
  },
  {
    cauDo: `"Lắng nghe thật kỹ, sẽ thấy Âm thanh (Âm - 音) phát ra từ tận cùng Trái tim (Tâm - 心).<br>Không cần mở miệng, người thương nhau vẫn thấu hiểu được..."`,
    dapAn: ['ý', 'y'],
  },
  {
    cauDo: `"Phía trên là sự Mất mát (Vong - 亡), phía dưới là Trái tim (Tâm - 心).<br>Phải chăng khi trái tim đã nếm đủ mất mát, người ta mới có thể buông tay?"`,
    dapAn: ['quên', 'quen'],
  },
  {
    cauDo: `"Giữ Trái tim (Tâm - 心) đứng lại ngay tại khoảnh khắc hiện tại (Kim - 今).<br>Không màng quá khứ, chẳng màng tương lai. Ta gọi đó là gì?"`,
    dapAn: ['niệm', 'hoài niệm', 'niem'],
  },
  {
    cauDo: `"Đem trái tim (Tâm) cất giấu dưới Mùa Thu,<br>Đổi lấy một tiếng thở dài giữa đêm muộn."`,
    dapAn: ['sầu', 'sau'],
  },
  {
    cauDo: `"Nước (Thủy) chảy ngang qua cánh rừng (Lâm) rậm rạp tĩnh mịch,<br>mang theo một vạt sương mù chìm dần xuống đáy."`,
    dapAn: ['trầm', 'tram'],
  },

  // --- HỆ CHƠI CHỮ TIẾNG VIỆT ---
  {
    cauDo: `"Vốn dĩ là một kiếp người dài đằng đẵng.<br>Nhưng buông bỏ sự êm đềm (dấu huyền), gánh thêm muộn phiền trĩu xuống (dấu nặng), bỗng hóa thành sự khắc khoải ngóng trông."`,
    dapAn: ['đợi', 'doi'],
  },
  {
    cauDo: `"Đang là tiếng hát ngân nga êm đềm.<br>Gánh thêm một nỗi buồn trĩu nặng, bỗng vỡ tan rớt xuống thềm rêu ngày mưa."`,
    dapAn: ['hạt', 'hat'],
  },
  {
    cauDo: `"Đứng một mình thì ngơ ngác, bơ vơ vô nghĩa.<br>Thêm một nét huyền nghiêng nghiêng, lại hóa thành kẻ cắm rễ ngoái nhìn mãi về một hướng."`,
    dapAn: ['chờ', 'cho'],
  },
  {
    cauDo: `"Thêm dấu huyền thì là chuyện ngày nào cũng thấy.<br>Bỏ dấu huyền đi lại hóa thành một đời day dứt khôn nguôi."`,
    dapAn: ['thương', 'thuong'],
  },
];

export const DANH_SACH_THU_TAY: ReadonlyArray<string> = [
  'Trái đất tròn, nhưng không phải ai cũng sẽ gặp lại nhau. Cảm ơn cậu vì hôm nay đã ghé qua, đã dừng lại và tĩnh tâm giải mã dòng chữ này. Chúc cậu một đời bình an.',
  'Có những nỗi buồn không thể nói ra, chỉ có thể giấu vào câu chữ. Nếu cậu đang mang một tâm sự như thế, hãy để nó lại Góc của Choco đêm nay nhé.',
  'Người ta nói khi bạn giải được một mật ngữ, nghĩa là tần số tâm hồn của bạn đang đồng điệu với người viết. Cậu không cô đơn đâu, ít nhất là ngay lúc này.',
];

export function evaluateRiddleAnswer(
  rawInput: string,
  riddle: MatNguItem = DANH_SACH_MAT_NGU[4]
): {
  isCorrect: boolean;
  message: string;
  color: string;
} {
  const input = rawInput.trim().toLowerCase();
  if (riddle.dapAn.includes(input)) {
    return {
      isCorrect: true,
      message: 'Khóa đã mở. Nỗi sầu của cậu, nay có Góc của Choco cất giữ. ✨',
      color: '#ffb6b9',
    };
  }
  return {
    isCorrect: false,
    message: 'Chưa đúng rồi, hãy nhắm mắt tĩnh tâm lại một chút xem...',
    color: '#a8948a',
  };
}

export type MemoryDifficultyLevel = 'easy' | 'medium' | 'hard';

export const KHO_BIEU_TUONG = [
  '☕',
  '💌',
  '☁️',
  '✨',
  '🕰️',
  '🕯️',
  '📻',
  '🍂',
  '🎞️',
  '🗝️',
  '🧸',
  '🌧️',
] as const;

export const DEFAULT_MEMORY_SYMBOLS = KHO_BIEU_TUONG.slice(0, 4);

export function getPairCountForLevel(level: MemoryDifficultyLevel): number {
  if (level === 'easy') return 4;
  if (level === 'medium') return 8;
  return 12;
}

export function createMemoryDeck(
  symbols: ReadonlyArray<string> = DEFAULT_MEMORY_SYMBOLS,
  randomFn: () => number = Math.random
): string[] {
  const deck = [...symbols, ...symbols];
  return deck.sort(() => 0.5 - randomFn());
}

export function createMemoryDeckForLevel(
  level: MemoryDifficultyLevel,
  randomFn: () => number = Math.random
): string[] {
  const pairs = getPairCountForLevel(level);
  const selectedSymbols = KHO_BIEU_TUONG.slice(0, pairs);
  return createMemoryDeck(selectedSymbols, randomFn);
}

export function isStarJarComplete(score: number, target: number = 15): boolean {
  return score >= target;
}

export interface SkyPolaroidItem {
  id: 'dawn' | 'noon' | 'golden_hour' | 'sunset' | 'twilight' | 'night';
  label: string;
  imageUrl: string;
  svgDataUri: string;
}

export const DANH_SACH_ANH_BAU_TROI: ReadonlyArray<SkyPolaroidItem> = [
  {
    id: 'dawn',
    label: 'Bình minh ửng hồng',
    imageUrl:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop',
    svgDataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%234a5588'/><stop offset='48%' stop-color='%23c97b98'/><stop offset='82%' stop-color='%23f5b195'/><stop offset='100%' stop-color='%23fce4b8'/></linearGradient><radialGradient id='sun' cx='0.5' cy='0.78' r='0.45'><stop offset='0%' stop-color='%23fff6d6' stop-opacity='0.95'/><stop offset='45%' stop-color='%23f9b895' stop-opacity='0.55'/><stop offset='100%' stop-color='%23f9b895' stop-opacity='0'/></radialGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><rect width='400' height='260' fill='url(%23sun)'/><circle cx='200' cy='200' r='34' fill='%23fff8e7' opacity='0.9'/><g fill='%23ffe5d9' opacity='0.55'><ellipse cx='95' cy='150' rx='55' ry='14'/><ellipse cx='130' cy='144' rx='40' ry='16'/><ellipse cx='305' cy='125' rx='62' ry='15'/><ellipse cx='275' cy='118' rx='42' ry='17'/></g><path d='M0 225 Q110 205 220 222 T400 215 L400 260 L0 260 Z' fill='%233d2e4f' opacity='0.65'/></svg>",
  },
  {
    id: 'noon',
    label: 'Bầu trời trưa trong vắt',
    imageUrl:
      'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=600&auto=format&fit=crop',
    svgDataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%233878c8'/><stop offset='60%' stop-color='%236fb1e8'/><stop offset='100%' stop-color='%23bfe3f7'/></linearGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><circle cx='320' cy='58' r='26' fill='%23fffbe6' opacity='0.9'/><g fill='%23ffffff' opacity='0.88'><ellipse cx='120' cy='145' rx='56' ry='22'/><ellipse cx='95' cy='135' rx='36' ry='24'/><ellipse cx='145' cy='132' rx='40' ry='26'/><ellipse cx='280' cy='175' rx='64' ry='20'/><ellipse cx='255' cy='162' rx='42' ry='22'/><ellipse cx='305' cy='160' rx='38' ry='20'/></g></svg>",
  },
  {
    id: 'golden_hour',
    label: 'Chiều tà nắng mật',
    imageUrl:
      'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?q=80&w=600&auto=format&fit=crop',
    svgDataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23594157'/><stop offset='42%' stop-color='%23b86b52'/><stop offset='78%' stop-color='%23e89c54'/><stop offset='100%' stop-color='%23f7d07a'/></linearGradient><radialGradient id='glow' cx='0.35' cy='0.72' r='0.5'><stop offset='0%' stop-color='%23fff3c4' stop-opacity='0.95'/><stop offset='50%' stop-color='%23f2a65a' stop-opacity='0.45'/><stop offset='100%' stop-color='%23f2a65a' stop-opacity='0'/></radialGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><rect width='400' height='260' fill='url(%23glow)'/><circle cx='140' cy='182' r='30' fill='%23fff4cc' opacity='0.92'/><g fill='%23ffd8a8' opacity='0.5'><ellipse cx='260' cy='115' rx='70' ry='14'/><ellipse cx='230' cy='108' rx='45' ry='16'/><ellipse cx='105' cy='100' rx='52' ry='12'/></g><path d='M0 228 Q140 212 270 225 T400 218 L400 260 L0 260 Z' fill='%232d1e24' opacity='0.8'/></svg>",
  },
  {
    id: 'sunset',
    label: 'Hoàng hôn tím khói',
    imageUrl:
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=600&auto=format&fit=crop',
    svgDataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23231942'/><stop offset='45%' stop-color='%235e548e'/><stop offset='75%' stop-color='%23be95c4'/><stop offset='100%' stop-color='%23e0b1cb'/></linearGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><circle cx='280' cy='190' r='36' fill='%23ffccd5' opacity='0.75'/><g fill='%239f86c0' opacity='0.55'><ellipse cx='125' cy='140' rx='68' ry='16'/><ellipse cx='160' cy='132' rx='46' ry='18'/><ellipse cx='290' cy='115' rx='58' ry='14'/></g><path d='M0 232 Q120 215 250 230 T400 222 L400 260 L0 260 Z' fill='%2319122b' opacity='0.88'/></svg>",
  },
  {
    id: 'twilight',
    label: 'Chạng vạng đầu đêm',
    imageUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    svgDataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%230d1b2a'/><stop offset='50%' stop-color='%231b263b'/><stop offset='82%' stop-color='%23415a77'/><stop offset='100%' stop-color='%23c98ca7'/></linearGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><g fill='%23ffffff' opacity='0.85'><circle cx='80' cy='52' r='1.5'/><circle cx='165' cy='38' r='2'/><circle cx='245' cy='68' r='1.2'/><circle cx='330' cy='44' r='1.8'/></g><path d='M295 62 A18 18 0 1 1 278 86 A14 14 0 1 0 295 62 Z' fill='%23fdf6e3' opacity='0.92'/><g fill='%232b3a55' opacity='0.6'><ellipse cx='135' cy='175' rx='65' ry='14'/><ellipse cx='285' cy='162' rx='55' ry='12'/></g><path d='M0 234 Q160 220 290 232 T400 226 L400 260 L0 260 Z' fill='%2309111c'/></svg>",
  },
  {
    id: 'night',
    label: 'Đêm trăng đầy sao',
    imageUrl:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop',
    svgDataUri:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23070b19'/><stop offset='55%' stop-color='%23131b3a'/><stop offset='100%' stop-color='%2328335c'/></linearGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><g fill='%23fdf6e3'><circle cx='55' cy='48' r='1.5' opacity='0.9'/><circle cx='110' cy='82' r='1.2' opacity='0.7'/><circle cx='145' cy='36' r='2' opacity='0.95'/><circle cx='205' cy='65' r='1.4' opacity='0.8'/><circle cx='255' cy='40' r='1.8' opacity='0.85'/><circle cx='340' cy='75' r='1.5' opacity='0.9'/><circle cx='85' cy='135' r='1.3' opacity='0.75'/><circle cx='315' cy='130' r='1.6' opacity='0.8'/></g><path d='M282 55 A22 22 0 1 1 260 84 A17 17 0 1 0 282 55 Z' fill='%23fef3c7'/><path d='M0 235 L75 192 L145 225 L230 180 L315 222 L370 198 L400 218 L400 260 L0 260 Z' fill='%23090d1a'/></svg>",
  },
];

export function pickRandomSkyPolaroid(
  previousId?: SkyPolaroidItem['id'] | null,
  randomFn: () => number = Math.random
): SkyPolaroidItem {
  const candidates = previousId
    ? DANH_SACH_ANH_BAU_TROI.filter((item) => item.id !== previousId)
    : DANH_SACH_ANH_BAU_TROI;
  const pool = candidates.length > 0 ? candidates : DANH_SACH_ANH_BAU_TROI;
  const idx = Math.floor(randomFn() * pool.length) % pool.length;
  return pool[idx];
}

// Hàm cất đồ vào kho (Tự động mã hóa)
export function catVaoKho(
  tenKho: string,
  duLieu: unknown,
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): void {
  if (!storage) return;
  storage.setItem(tenKho, JSON.stringify(duLieu));
}

// Hàm lấy đồ từ kho ra (Tự động giải mã, nếu kho trống thì trả về mảng rỗng)
export function layTuKho<T = unknown[]>(
  tenKho: string,
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): T {
  if (!storage) return [] as unknown as T;
  try {
    const duLieu = storage.getItem(tenKho);
    return duLieu ? (JSON.parse(duLieu) as T) : ([] as unknown as T);
  } catch {
    return [] as unknown as T;
  }
}

export interface DuLieuBaoMatKyUc {
  kyUc: unknown;
  diemSao: unknown;
}

export function buildKyUcBackupPayload(
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : undefined
): DuLieuBaoMatKyUc {
  return {
    kyUc: layTuKho('chocoMemories', storage),
    diemSao: layTuKho('diemGomSao', storage),
  };
}

export function parseKyUcRestorePayload(rawJsonText: string): {
  valid: boolean;
  kyUc?: unknown;
  diemSao?: unknown;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJsonText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        valid: false,
        error: 'Hình như đây không phải là chiếc hộp ký ức của Choco...',
      };
    }
    const obj = parsed as Record<string, unknown>;
    if (!('kyUc' in obj) && !('diemSao' in obj)) {
      return {
        valid: false,
        error: 'Hình như đây không phải là chiếc hộp ký ức của Choco...',
      };
    }
    return {
      valid: true,
      kyUc: Array.isArray(obj.kyUc) ? obj.kyUc : [],
      diemSao: obj.diemSao ?? [],
    };
  } catch {
    return {
      valid: false,
      error: 'Hình như đây không phải là chiếc hộp ký ức của Choco...',
    };
  }
}


