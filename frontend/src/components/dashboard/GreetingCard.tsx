import React from "react";
import { useCharacterStore } from "@/stores/characterStore";
import { CharacterIcon } from "@/components/shared/CharacterIcon";

interface GreetingCardProps {
  displayName: string;
  weeklyRate?: number | null;
}

function getTimeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "おはよう";
  if (hour >= 12 && hour < 18) return "こんにちは";
  return "こんばんは";
}

function getWeeklySummaryMessage(weeklyRate: number | null): string {
  if (weeklyRate === null) return "今日もお薬を忘れずに";
  if (weeklyRate >= 90) return "素晴らしい1週間です。この調子で続けましょう";
  if (weeklyRate >= 70) return "順調にお薬を服用できています";
  if (weeklyRate >= 50) return "少しずつ習慣にしていきましょう";
  return "一緒に頑張りましょう。無理せず続けることが大切です";
}

export const GreetingCard: React.FC<GreetingCardProps> = ({ displayName, weeklyRate }) => {
  // selectedCharacter を購読して、キャラクター変更時に再レンダリングさせる
  useCharacterStore((s) => s.selectedCharacter);
  const config = useCharacterStore((s) => s.getConfig)();
  const now = new Date();
  const greeting = getTimeGreeting(now.getHours());
  const summaryMessage = getWeeklySummaryMessage(weeklyRate ?? null);

  return (
    <div className="bg-white rounded-2xl p-4 mb-6 flex items-center space-x-3 shadow-sm border border-primary-100">
      <div className="bg-primary-50 rounded-2xl p-1.5">
        <CharacterIcon type={config.type} size={36} className="text-ink-700" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-800">
          {greeting}、{displayName}さん
        </p>
        <p className="text-xs text-ink-600 mt-0.5">
          {summaryMessage}
          {config.suffix}
        </p>
        <p className="text-xs text-ink-400 mt-0.5">{config.name}より</p>
      </div>
    </div>
  );
};
