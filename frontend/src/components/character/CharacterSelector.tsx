import React from 'react';
import { CharacterType, CHARACTER_CONFIGS } from '../../types/character';
import { useCharacterStore } from '../../stores/characterStore';

const characterTypes: CharacterType[] = ['dog', 'cat', 'rabbit', 'bird'];

export const CharacterSelector: React.FC = () => {
  const { selectedCharacter, setCharacter } = useCharacterStore();

  return (
    <div className="grid grid-cols-2 gap-3">
      {characterTypes.map((type) => {
        const config = CHARACTER_CONFIGS[type];
        const isSelected = selectedCharacter === type;

        return (
          <button
            key={type}
            onClick={() => setCharacter(type)}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <span className="text-4xl mb-2">{config.icon}</span>
            <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
              {config.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
