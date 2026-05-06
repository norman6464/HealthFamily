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
    <div className="bg-white rounded-2xl p-4 mb-6 flex items-center space-x-3 shadow-soft border border-pink-100">
      <div className="bg-pink-50 rounded-2xl p-1.5">
        <CharacterIcon type={config.type} size={36} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-800">
          {greeting}、{displayName}さん
        </p>
        <p className="text-xs text-ink-600 mt-0.5">{summaryMessage}{config.suffix}</p>
        <p className="text-xs text-gray-400 mt-0.5">{config.name}より</p>
      </div>
    </div>
  );
};
