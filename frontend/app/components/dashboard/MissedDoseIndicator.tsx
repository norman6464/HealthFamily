import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { getOverdueLevelStyle, type OverdueLevel } from "@/hooks/dashboard";

interface MissedDoseIndicatorProps {
  overdueLevel: OverdueLevel;
  overdueMinutes: number;
}

export const MissedDoseIndicator: React.FC<MissedDoseIndicatorProps> = ({
  overdueLevel,
  overdueMinutes,
}) => {
  if (overdueLevel === "none") return null;

  const style = getOverdueLevelStyle(overdueLevel);
  const hours = Math.floor(overdueMinutes / 60);
  const mins = overdueMinutes % 60;
  const timeLabel = hours > 0 ? `${hours}時間${mins > 0 ? `${mins}分` : ""}` : `${mins}分`;

  return (
    <div className={`flex items-center space-x-1 text-xs ${style.text}`}>
      {overdueLevel === "danger" ? <AlertTriangle size={14} /> : <Clock size={14} />}
      <span>{timeLabel}経過</span>
    </div>
  );
};
