import React from 'react';
import { useCharacterStore } from '../../stores/characterStore';
import { CharacterIcon } from '../shared/CharacterIcon';

interface GreetingCardProps {
  displayName: string;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'おはよう';
  if (hour >= 12 && hour < 18) return 'こんにちは';
  return 'こんばんは';
}

export const GreetingCard: React.FC<GreetingCardProps> = ({ displayName }) => {
  const { getConfig } = useCharacterStore();
  const config = getConfig();
  const greeting = getTimeGreeting();

  return (
    <div className="bg-primary-50 rounded-lg p-4 mb-6 flex items-center space-x-3">
      <CharacterIcon type={config.type} size={40} />
      <div>
        <p className="text-sm font-medium text-primary-800">
          {greeting}、{displayName}さん
        </p>
        <p className="text-xs text-primary-600">{config.name}より</p>
      </div>
    </div>
  );
};
