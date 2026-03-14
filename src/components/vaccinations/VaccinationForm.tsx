'use client';

import React, { useState } from 'react';
import { Member } from '../../domain/entities/Member';

export interface VaccinationFormData {
  memberId: string;
  vaccineName: string;
  vaccinatedAt: string;
  nextScheduledDate?: string;
  notes?: string;
}

interface VaccinationFormProps {
  members: Member[];
  onSubmit: (data: VaccinationFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    vaccineName: string;
    vaccinatedAt: Date;
    nextScheduledDate?: Date;
    notes?: string;
  };
}

export const VaccinationForm: React.FC<VaccinationFormProps> = ({ members, onSubmit, onCancel, initialData }) => {
  const [memberId, setMemberId] = useState(initialData?.memberId || (members.length === 1 ? members[0].id : ''));
  const [vaccineName, setVaccineName] = useState(initialData?.vaccineName || '');
  const [vaccinatedAt, setVaccinatedAt] = useState(
    initialData?.vaccinatedAt ? initialData.vaccinatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  );
  const [nextScheduledDate, setNextScheduledDate] = useState(
    initialData?.nextScheduledDate ? initialData.nextScheduledDate.toISOString().split('T')[0] : '',
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !vaccineName.trim() || !vaccinatedAt) return;

    onSubmit({
      memberId,
      vaccineName: vaccineName.trim(),
      vaccinatedAt: new Date(vaccinatedAt).toISOString(),
      nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setVaccineName('');
      setVaccinatedAt(new Date().toISOString().split('T')[0]);
      setNextScheduledDate('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="vacc-member" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー
        </label>
        <select
          id="vacc-member"
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
        <label htmlFor="vacc-name" className="block text-sm font-medium text-gray-700 mb-1">
          ワクチンの種類
        </label>
        <input
          id="vacc-name"
          type="text"
          value={vaccineName}
          onChange={(e) => setVaccineName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="例: インフルエンザ、混合ワクチン"
        />
      </div>

      <div>
        <label htmlFor="vacc-date" className="block text-sm font-medium text-gray-700 mb-1">
          ワクチン接種日
        </label>
        <input
          id="vacc-date"
          type="date"
          value={vaccinatedAt}
          onChange={(e) => setVaccinatedAt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="vacc-next" className="block text-sm font-medium text-gray-700 mb-1">
          次回ワクチン予定日（任意）
        </label>
        <input
          id="vacc-next"
          type="date"
          value={nextScheduledDate}
          onChange={(e) => setNextScheduledDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="vacc-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="vacc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="メモを入力"
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
