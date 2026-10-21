export interface MultiverseShow {
  id: string;
  title: string;           // Tên show
  description: string;     // Mô tả show
  charactersInfo: string;  // Thông tin các nhân vật
  link: string;            // Link
  tags?: string[];
  createdAt?: number;
}

export interface MultiverseOpenWorld {
  id: string;
  title: string;           // Tên OPW
  description: string;     // Mô tả
  link: string;            // Link
  tags?: string[];
  createdAt?: number;
}

export interface ShowFormInput {
  title: string;
  description: string;
  charactersInfo: string;
  link: string;
  tagsText?: string;
}

export interface OpenWorldFormInput {
  title: string;
  description: string;
  link: string;
  tagsText?: string;
}
