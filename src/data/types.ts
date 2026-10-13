export type SkinModel = 'default' | 'slim';
export type TextureKind = 'skin' | 'cape';
export type AnimationName = 'idle' | 'walk' | 'run' | 'fly' | 'wave' | 'crouch' | 'hit';

// Mutable view models populated from parsed REST responses.
export interface TexturePreview {
  id: string;
  name: string;
  type: TextureKind;
  model: SkinModel;
  source: '原创' | '转载';
  author: string;
  uploaderId: string | null;
  isPublic: boolean;
  isFavorited: boolean;
  owned: boolean;
  image: string;
  description: string;
  createdAt: string;
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
}
export interface PlayerPreview {
  id: string;
  name: string;
  owner: string;
  ownerName: string;
  model: SkinModel;
  skinId: string | null;
  capeId: string | null;
  createdAt: string;
}
export interface UserPreview {
  id: string;
  username: string;
  nickname: string;
  email: string;
  role: 'Admin' | 'Player';
  language: string;
  maxPlayers: number;
  disabled: boolean;
  createdAt: string;
}
