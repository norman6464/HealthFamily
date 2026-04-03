import React from 'react';
import { useCharacterStore } from '../../stores/characterStore';
import { CharacterIcon } from '../shared/CharacterIcon';
import { GreetingMessageEntity } from '../../domain/entities/GreetingMessage';

interface GreetingCardProps {
  displayName: string;
  weeklyRate?: number | null;
}

export const GreetingCard: React.FC<GreetingCardProps> = ({ displayName, weeklyRate }) => {
  const { getConfig } = useCharacterStore();
  const config = getConfig();
  const now = new Date();
  const greeting = GreetingMessageEntity.getTimeGreeting(now.getHours());
  const summaryMessage = GreetingMessageEntity.getWeeklySummaryMessage(weeklyRate ?? null);

  return (
    <div className="bg-gradient-greeting rounded-2xl p-4 mb-6 flex items-center space-x-3 shadow-soft border border-pink-100">
      <CharacterIcon type={config.type} size={40} />
      <div>
        <p className="text-sm font-medium text-primary-800">
          {greeting}、{displayName}さん
        </p>
        <p className="text-xs text-primary-600 mt-0.5">{summaryMessage}{config.suffix}</p>
        <p className="text-xs text-accent-400 mt-0.5">{config.name}より</p>
      </div>
    </div>
  );
};
