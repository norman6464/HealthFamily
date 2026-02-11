import type { CharacterType } from './character';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  characterType: CharacterType;
  characterName: string;
  createdAt: string;
  updatedAt: string;
}
