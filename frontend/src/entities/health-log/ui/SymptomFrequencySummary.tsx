import React from "react";
import { Thermometer } from "lucide-react";
import { SYMPTOM_LABELS, type SymptomFrequency } from "../model/healthLog";

interface SymptomFrequencySummaryProps {
  symptoms: SymptomFrequency[];
}

export const SymptomFrequencySummary: React.FC<SymptomFrequencySummaryProps> =
  React.memo(({ symptoms }) => {
    if (symptoms.length === 0) return null;

    const maxCount = Math.max(...symptoms.map((s) => s.count));

    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary-100 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <Thermometer size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-ink-700">
            よく記録された症状
          </h3>
        </div>

        <div className="space-y-2">
          {symptoms.map((item) => (
            <div key={item.symptom} className="flex items-center space-x-2">
              <span className="text-xs text-ink-600 w-12 shrink-0">
                {SYMPTOM_LABELS[item.symptom]}
              </span>
              <div className="flex-1 bg-primary-50 rounded-full h-4">
                <div
                  data-testid="symptom-bar"
                  className="bg-primary-400 rounded-full h-4"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ink-500 w-8 text-right shrink-0">
                {item.count}回
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  });

SymptomFrequencySummary.displayName = "SymptomFrequencySummary";
