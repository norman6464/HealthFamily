import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHARACTER_CONFIGS } from '@/lib/character';
import type { CharacterType, CharacterConfig } from '@/lib/character';

type MessageKey = keyof CharacterConfig['messages'];

interface CharacterState {
  selectedCharacter: CharacterType;
  setCharacter: (character: CharacterType) => void;
  getConfig: () => CharacterConfig;
  getMessage: (key: MessageKey) => string;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'character-storage',
      partialize: (state) => ({ selectedCharacter: state.selectedCharacter }),
    },
  ),
);
