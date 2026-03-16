'use client';

import React, { useState } from 'react';
import { Member } from '../../domain/entities/Member';

export interface ExaminationFormData {
  memberId: string;
  examinationType: string;
  examinedAt: string;
  nextScheduledDate?: string;
  notes?: string;
}

interface ExaminationFormProps {
  members: Member[];
  onSubmit: (data: ExaminationFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    examinationType: string;
    examinedAt: Date;
    nextScheduledDate?: Date;
    notes?: string;
  };
}

export const ExaminationForm: React.FC<ExaminationFormProps> = ({ members, onSubmit, onCancel, initialData }) => {
  const [memberId, setMemberId] = useState(initialData?.memberId || (members.length === 1 ? members[0].id : ''));
  const [examinationType, setExaminationType] = useState(initialData?.examinationType || '');
  const [examinedAt, setExaminedAt] = useState(
    initialData?.examinedAt ? initialData.examinedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  );
  const [nextScheduledDate, setNextScheduledDate] = useState(
    initialData?.nextScheduledDate ? initialData.nextScheduledDate.toISOString().split('T')[0] : '',
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !examinationType.trim() || !examinedAt) return;

    onSubmit({
      memberId,
      examinationType: examinationType.trim(),
      examinedAt: new Date(examinedAt).toISOString(),
      nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setExaminationType('');
      setExaminedAt(new Date().toISOString().split('T')[0]);
      setNextScheduledDate('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="exam-member" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー
        </label>
        <select
          id="exam-member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        >
          <option value="">選択してください</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="exam-type" className="block text-sm font-medium text-gray-700 mb-1">
          検査の種類
        </label>
        <input
          id="exam-type"
          type="text"
          value={examinationType}
          onChange={(e) => setExaminationType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
          placeholder="例: 健康診断、血液検査、歯科検診"
        />
      </div>

      <div>
        <label htmlFor="exam-date" className="block text-sm font-medium text-gray-700 mb-1">
          検査日
        </label>
        <input
          id="exam-date"
          type="date"
          value={examinedAt}
          onChange={(e) => setExaminedAt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="exam-next" className="block text-sm font-medium text-gray-700 mb-1">
          次回検査日（任意）
        </label>
        <input
          id="exam-next"
          type="date"
          value={nextScheduledDate}
          onChange={(e) => setNextScheduledDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label htmlFor="exam-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="exam-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder="メモを入力"
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
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
