import { create } from 'zustand';
import { CharacterType, CharacterConfig, CHARACTER_CONFIGS } from '../types/character';

type MessageKey = keyof CharacterConfig['messages'];

interface CharacterState {
  selectedCharacter: CharacterType;
  setCharacter: (character: CharacterType) => void;
  getConfig: () => CharacterConfig;
  getMessage: (key: MessageKey) => string;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  selectedCharacter: 'cat',

  setCharacter: (character: CharacterType) => {
    set({ selectedCharacter: character });
  },

  getConfig: () => {
    return CHARACTER_CONFIGS[get().selectedCharacter];
  },

  getMessage: (key: MessageKey) => {
    return CHARACTER_CONFIGS[get().selectedCharacter].messages[key];
  },
}));
