import type { DiaryMemoryItem } from '../types/character';
import type { MusicVibeType } from '../utils/characterLogic';

export interface SavedCommandRecord {
  id: string;
  title: string;
  content: string;
}

export const INITIAL_SAVED_COMMANDS: SavedCommandRecord[] = [];

export const INITIAL_MEMORIES: DiaryMemoryItem[] = [];

export const INITIAL_FAVORITE_IDS: string[] = [];

export const INITIAL_HOUSE_FAVORITE_RAW: string | null =
  '{"characterId":"char-custom-1792521701224","dateKey":"2026-10-21"}';

export const INITIAL_VIBE_OVERRIDES: Record<string, MusicVibeType> = {
  'congb-cho-chut': 'light',
  'izara-moianh': 'dark',
  'coolkid-sau-con-mua': 'light',
  'haanhuy-nhuctiemthuc': 'dark',
  'youngpuppy-wrong-times': 'light',
  'kimlong-let-me-go': 'dark',
  'dangrangto-xuong-rong': 'light',
};

export const INITIAL_ACTIVE_VIBE: MusicVibeType = 'light';
