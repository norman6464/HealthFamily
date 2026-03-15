'use client';

import React, { useState } from 'react';
import { Member } from '../../domain/entities/Member';

export interface AllergyFormData {
  memberId: string;
  allergenName: string;
  allergyType: string;
  severity: string;
  symptoms?: string;
  diagnosedAt?: string;
  notes?: string;
}

interface AllergyFormProps {
  members: Member[];
  onSubmit: (data: AllergyFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    allergenName: string;
    allergyType: string;
    severity: string;
    symptoms?: string;
    diagnosedAt?: string;
    notes?: string;
  };
}

const ALLERGY_TYPES = [
  { value: 'food', label: '食物' },
  { value: 'medication', label: '薬物' },
  { value: 'environmental', label: '環境' },
  { value: 'pollen', label: '花粉' },
  { value: 'other', label: 'その他' },
];

const SEVERITY_LEVELS = [
  { value: 'mild', label: '軽度' },
  { value: 'moderate', label: '中度' },
  { value: 'severe', label: '重度' },
];

export const AllergyForm: React.FC<AllergyFormProps> = ({ members, onSubmit, onCancel, initialData }) => {
  const [memberId, setMemberId] = useState(initialData?.memberId || (members.length === 1 ? members[0].id : ''));
  const [allergenName, setAllergenName] = useState(initialData?.allergenName || '');
  const [allergyType, setAllergyType] = useState(initialData?.allergyType || '');
  const [severity, setSeverity] = useState(initialData?.severity || '');
  const [symptoms, setSymptoms] = useState(initialData?.symptoms || '');
  const [diagnosedAt, setDiagnosedAt] = useState(initialData?.diagnosedAt || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !allergenName.trim() || !allergyType || !severity) return;

    onSubmit({
      memberId,
      allergenName: allergenName.trim(),
      allergyType,
      severity,
      symptoms: symptoms.trim() || undefined,
      diagnosedAt: diagnosedAt || undefined,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setAllergenName('');
      setAllergyType('');
      setSeverity('');
      setSymptoms('');
      setDiagnosedAt('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="allergy-member" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー
        </label>
        <select
          id="allergy-member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">選択してください</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="allergy-name" className="block text-sm font-medium text-gray-700 mb-1">
          アレルゲン名
        </label>
        <input
          id="allergy-name"
          type="text"
          value={allergenName}
          onChange={(e) => setAllergenName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="例: ピーナッツ、ペニシリン、花粉"
        />
      </div>

      <div>
        <label htmlFor="allergy-type" className="block text-sm font-medium text-gray-700 mb-1">
          アレルギーの種類
        </label>
        <select
          id="allergy-type"
          value={allergyType}
          onChange={(e) => setAllergyType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">選択してください</option>
          {ALLERGY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="allergy-severity" className="block text-sm font-medium text-gray-700 mb-1">
          重症度
        </label>
        <select
          id="allergy-severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">選択してください</option>
          {SEVERITY_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="allergy-symptoms" className="block text-sm font-medium text-gray-700 mb-1">
          症状（任意）
        </label>
        <textarea
          id="allergy-symptoms"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="例: アナフィラキシー、じんましん、呼吸困難"
        />
      </div>

      <div>
        <label htmlFor="allergy-diagnosed" className="block text-sm font-medium text-gray-700 mb-1">
          診断日（任意）
        </label>
        <input
          id="allergy-diagnosed"
          type="text"
          inputMode="numeric"
          value={diagnosedAt}
          onChange={(e) => setDiagnosedAt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="例: 2024-01-15"
        />
      </div>

      <div>
        <label htmlFor="allergy-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="allergy-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="例: エピペン携帯必要"
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {initialData ? '更新する' : '登録する'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
