import React from "react";
import { CHARACTER_CONFIGS } from "@/lib/character";
import type { CharacterType } from "@/lib/character";
import { useCharacterStore } from "@/stores/characterStore";
import { CharacterIcon } from "@/components/shared/CharacterIcon";

const characterTypes: CharacterType[] = ["dog", "cat", "rabbit", "bird"];

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
                ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                : "border-primary-100 bg-white hover:border-primary-300"
            }`}
          >
            <CharacterIcon type={type} size={40} className="mb-2 text-ink-700" />
            <span
              className={`text-sm font-medium ${
                isSelected ? "text-primary-700" : "text-ink-600"
              }`}
            >
              {config.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
