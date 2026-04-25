'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface TemperatureFormData {
  memberId: string;
  temperature: number;
  measuredAt: string;
  notes?: string;
}

interface TemperatureFormProps {
  members: { id: string; name: string }[];
  onSubmit: (data: TemperatureFormData) => Promise<void>;
  onCancel: () => void;
}

function getNowLocalIsoForInput(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export const TemperatureForm: React.FC<TemperatureFormProps> = ({ members, onSubmit, onCancel }) => {
  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [temperature, setTemperature] = useState('36.5');
  const [measuredAt, setMeasuredAt] = useState(getNowLocalIsoForInput());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId) {
      setError('メンバーを選択してください');
      return;
    }

    const tempNum = parseFloat(temperature);
    if (!Number.isFinite(tempNum) || tempNum < 30 || tempNum > 45) {
      setError('体温は30.0〜45.0の範囲で入力してください');
      return;
    }
    if (!measuredAt) {
      setError('計測時刻を選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        memberId,
        temperature: tempNum,
        measuredAt: new Date(measuredAt).toISOString(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">体温を記録</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="temp-member" className="block text-sm font-medium text-gray-700 mb-1">
            メンバー
          </label>
          <select
            id="temp-member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="temp-value" className="block text-sm font-medium text-gray-700 mb-1">
              体温 (°C)
            </label>
            <input
              id="temp-value"
              type="number"
              step="0.1"
              min="30"
              max="45"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              inputMode="decimal"
            />
          </div>
          <div>
            <label htmlFor="temp-time" className="block text-sm font-medium text-gray-700 mb-1">
              計測時刻
            </label>
            <input
              id="temp-time"
              type="datetime-local"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="temp-notes" className="block text-sm font-medium text-gray-700 mb-1">
            メモ（任意）
          </label>
          <textarea
            id="temp-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例: 解熱剤服用後 / 朝起床時"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            rows={2}
            maxLength={500}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !memberId}
          className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? '記録中...' : '記録する'}
        </button>
      </div>
    </form>
  );
};
