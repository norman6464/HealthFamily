import React, { useState } from "react";
import { X } from "lucide-react";
import {
  CONDITION_LEVELS,
  SYMPTOM_OPTIONS,
  getConditionColor,
  getConditionLabel,
  getSymptomLabel,
  type ConditionLevel,
  type SymptomType,
} from "@/entities/health-log";
import type { CreateHealthLogInput } from "../api/createHealthLog";

interface HealthLogFormProps {
  members: { id: string; name: string }[];
  onSubmit: (input: CreateHealthLogInput) => Promise<void>;
  onCancel: () => void;
}

export const HealthLogForm: React.FC<HealthLogFormProps> = ({
  members,
  onSubmit,
  onCancel,
}) => {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [conditionLevel, setConditionLevel] = useState<ConditionLevel>(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSymptom = (symptom: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        memberId,
        conditionLevel,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm p-4 border border-primary-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ink-800">体調を記録</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-400 hover:text-ink-600"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            メンバー
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-xl text-sm outline-none focus:border-primary"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            体調レベル
          </label>
          <div className="flex justify-between">
            {CONDITION_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setConditionLevel(level)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-colors ${
                  conditionLevel === level
                    ? "border-primary-500 bg-primary-50"
                    : "border-primary-100 hover:border-primary-300"
                }`}
              >
                <span
                  className={`text-lg font-bold ${getConditionColor(level)}`}
                >
                  {level}
                </span>
                <span className="text-xs text-ink-500 mt-0.5">
                  {getConditionLabel(level)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            症状（複数選択可）
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedSymptoms.includes(symptom)
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-primary-100 text-ink-600 hover:border-primary-300"
                }`}
              >
                {getSymptomLabel(symptom)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            メモ（任意）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="体調に関するメモ..."
            className="w-full px-3 py-2 border border-primary-200 rounded-xl text-sm resize-none outline-none focus:border-primary"
            rows={3}
            maxLength={500}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !memberId}
          className="w-full py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "記録中..." : "記録する"}
        </button>
      </div>
    </form>
  );
};
