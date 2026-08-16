import React from "react";
import { Trash2, Thermometer } from "lucide-react";
import {
  classifyTemperature,
  getTemperatureCategoryColor,
  getTemperatureCategoryLabel,
  type TemperatureRecordView,
} from "../model/temperatureRecord";

interface TemperatureRecordListProps {
  records: TemperatureRecordView[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

function formatDateTime(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

export const TemperatureRecordList: React.FC<TemperatureRecordListProps> = ({
  records,
  isLoading,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="py-4 text-center text-sm text-ink-400">読み込み中...</div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-ink-400">
        体温の記録はまだありません
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {records.map((r) => {
        const category = classifyTemperature(r.temperature);
        const colorClass = getTemperatureCategoryColor(category);
        const categoryLabel = getTemperatureCategoryLabel(category);
        return (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-2xl border border-primary-100 bg-white p-3"
          >
            <div className="flex items-center space-x-3">
              <Thermometer size={18} className={colorClass} />
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-base font-semibold ${colorClass}`}>
                    {r.temperature.toFixed(1)}°C
                  </span>
                  <span className="text-xs text-ink-500">{categoryLabel}</span>
                </div>
                <div className="text-xs text-ink-500">
                  {r.memberName ? `${r.memberName}・` : ""}
                  {formatDateTime(r.measuredAt)}
                </div>
                {r.notes && (
                  <div className="mt-1 text-xs text-ink-600">{r.notes}</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDelete(r.id)}
              className="p-1 text-ink-400 hover:text-red-600"
              aria-label="削除"
            >
              <Trash2 size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
};
