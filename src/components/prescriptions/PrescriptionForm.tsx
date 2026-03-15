'use client';

import React, { useState } from 'react';
import { Member } from '../../domain/entities/Member';

export interface PrescriptionFormData {
  memberId: string;
  prescriptionName: string;
  prescribedBy?: string;
  prescribedAt: string;
  expiresAt?: string;
  pharmacyName?: string;
  notes?: string;
}

interface PrescriptionFormProps {
  members: Member[];
  onSubmit: (data: PrescriptionFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    prescriptionName: string;
    prescribedBy?: string;
    prescribedAt: string;
    expiresAt?: string;
    pharmacyName?: string;
    notes?: string;
  };
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ members, onSubmit, onCancel, initialData }) => {
  const [memberId, setMemberId] = useState(initialData?.memberId || (members.length === 1 ? members[0].id : ''));
  const [prescriptionName, setPrescriptionName] = useState(initialData?.prescriptionName || '');
  const [prescribedBy, setPrescribedBy] = useState(initialData?.prescribedBy || '');
  const [prescribedAt, setPrescribedAt] = useState(initialData?.prescribedAt || new Date().toISOString().split('T')[0]);
  const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt || '');
  const [pharmacyName, setPharmacyName] = useState(initialData?.pharmacyName || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !prescriptionName.trim() || !prescribedAt) return;

    onSubmit({
      memberId,
      prescriptionName: prescriptionName.trim(),
      prescribedBy: prescribedBy.trim() || undefined,
      prescribedAt,
      expiresAt: expiresAt || undefined,
      pharmacyName: pharmacyName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setPrescriptionName('');
      setPrescribedBy('');
      setExpiresAt('');
      setPharmacyName('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rx-member" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー
        </label>
        <select
          id="rx-member"
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
        <label htmlFor="rx-name" className="block text-sm font-medium text-gray-700 mb-1">
          処方箋名
        </label>
        <input
          id="rx-name"
          type="text"
          value={prescriptionName}
          onChange={(e) => setPrescriptionName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="例: 高血圧治療薬、抗生物質"
        />
      </div>

      <div>
        <label htmlFor="rx-doctor" className="block text-sm font-medium text-gray-700 mb-1">
          処方医（任意）
        </label>
        <input
          id="rx-doctor"
          type="text"
          value={prescribedBy}
          onChange={(e) => setPrescribedBy(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="例: 山田太郎 医師"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rx-date" className="block text-sm font-medium text-gray-700 mb-1">
            処方日
          </label>
          <input
            id="rx-date"
            type="date"
            value={prescribedAt}
            onChange={(e) => setPrescribedAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="rx-expires" className="block text-sm font-medium text-gray-700 mb-1">
            有効期限（任意）
          </label>
          <input
            id="rx-expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rx-pharmacy" className="block text-sm font-medium text-gray-700 mb-1">
          薬局名（任意）
        </label>
        <input
          id="rx-pharmacy"
          type="text"
          value={pharmacyName}
          onChange={(e) => setPharmacyName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="例: 調剤薬局ABC"
        />
      </div>

      <div>
        <label htmlFor="rx-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="rx-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="リフィル回数、注意事項など"
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
