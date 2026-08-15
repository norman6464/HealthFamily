import React, { useState } from "react";
import type { Member } from "@/lib/types";

export interface BodyMeasurementFormData {
  memberId: string;
  weight?: number;
  height?: number;
  recordedAt: string;
  notes?: string;
}

interface BodyMeasurementFormProps {
  members: Member[];
  onSubmit: (data: BodyMeasurementFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    weight?: number;
    height?: number;
    recordedAt: string;
    notes?: string;
  };
}

export const BodyMeasurementForm: React.FC<BodyMeasurementFormProps> = ({
  members,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [memberId, setMemberId] = useState(
    initialData?.memberId || (members.length === 1 ? members[0].id : ""),
  );
  const [weight, setWeight] = useState(initialData?.weight?.toString() || "");
  const [height, setHeight] = useState(initialData?.height?.toString() || "");
  const [recordedAt, setRecordedAt] = useState(
    initialData?.recordedAt || new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !recordedAt) return;
    const w = weight ? parseFloat(weight) : undefined;
    const h = height ? parseFloat(height) : undefined;
    if (w == null && h == null) return;

    onSubmit({
      memberId,
      weight: w,
      height: h,
      recordedAt,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setWeight("");
      setHeight("");
      setNotes("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="bm-member"
          className="block text-sm font-medium text-ink-700 mb-1"
        >
          メンバー
        </label>
        <select
          id="bm-member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-xl outline-none focus:border-primary"
          required
        >
          <option value="">選択してください</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="bm-weight"
            className="block text-sm font-medium text-ink-700 mb-1"
          >
            体重 (kg)
          </label>
          <input
            id="bm-weight"
            type="number"
            step="0.1"
            min="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-xl outline-none focus:border-primary"
            placeholder="65.5"
          />
        </div>
        <div>
          <label
            htmlFor="bm-height"
            className="block text-sm font-medium text-ink-700 mb-1"
          >
            身長 (cm)
          </label>
          <input
            id="bm-height"
            type="number"
            step="0.1"
            min="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-xl outline-none focus:border-primary"
            placeholder="170.0"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="bm-date"
          className="block text-sm font-medium text-ink-700 mb-1"
        >
          記録日
        </label>
        <input
          id="bm-date"
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-xl outline-none focus:border-primary"
          required
        />
      </div>

      <div>
        <label
          htmlFor="bm-notes"
          className="block text-sm font-medium text-ink-700 mb-1"
        >
          メモ（任意）
        </label>
        <textarea
          id="bm-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-xl outline-none focus:border-primary"
          rows={2}
          placeholder="朝食前に測定、など"
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition-colors font-medium"
        >
          {initialData ? "更新する" : "記録する"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-primary-50 text-ink-700 py-2 px-4 rounded-xl hover:bg-primary-100 transition-colors font-medium"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
