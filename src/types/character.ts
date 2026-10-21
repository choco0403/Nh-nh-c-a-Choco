export interface AlternateGreeting {
  id: string;
  label: string;
  context: string;
  message: string;
}

export interface CharacterProfile {
  id: string;
  code: string;
  name: string;
  birthday?: string;
  age?: string;
  zodiac?: string;
  personality?: string;
  tags: string[];
  shortHook: string;
  backstory: string[];
  personalityNotes: string;
  openingMessage: string;
  alternateGreetings?: AlternateGreeting[];
  characterLink: string;
  platformName: string;
  creatorHandle: string;
  avatarKey: 'linh_dan' | 'seraphina' | 'kaelen' | 'julian' | 'astraea' | 'minh_triet' | 'custom';
  customAvatarUrl?: string;
  accentHex: string;
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface CharacterFilterOptions {
  selectedCreator?: string;
  selectedTags?: string[];
  searchQuery: string;
  onlyFavorites?: boolean;
  favoriteIds?: string[];
}

export interface CharacterFormInput {
  name: string;
  birthday?: string;
  age?: string;
  zodiac?: string;
  personality?: string;
  tagsText: string;
  shortHook?: string;
  backstoryText: string;
  personalityNotes: string;
  openingMessage: string;
  characterLink: string;
  platformName: string;
  creatorHandle: string;
  customAvatarUrl?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CharacterFormInput, string>>;
}

export interface UserProfilePreference {
  id: string;
  name: string;
  favoriteCharacterIds: string[];
}

export interface SavedCommandItem {
  id: string;
  title: string;
  content: string;
}

export interface DatingIdeaItem {
  id: string;
  title: string;
  category: string;
  content: string;
  isCompleted?: boolean;
  createdAt: number;
}

export interface DiaryMemoryItem {
  id?: string;
  date: string;
  character: string;
  quote: string;
  thought: string;
}
