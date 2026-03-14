'use client';

import React, { useState } from 'react';
import { Member } from '../../domain/entities/Member';

export interface InsuranceFormData {
  memberId: string;
  insuranceType: string;
  providerName?: string;
  policyNumber?: string;
  notes?: string;
}

interface InsuranceFormProps {
  members: Member[];
  onSubmit: (data: InsuranceFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    insuranceType: string;
    providerName?: string;
    policyNumber?: string;
    notes?: string;
  };
}

export const InsuranceForm: React.FC<InsuranceFormProps> = ({ members, onSubmit, onCancel, initialData }) => {
  const [memberId, setMemberId] = useState(initialData?.memberId || (members.length === 1 ? members[0].id : ''));
  const [insuranceType, setInsuranceType] = useState(initialData?.insuranceType || '');
  const [providerName, setProviderName] = useState(initialData?.providerName || '');
  const [policyNumber, setPolicyNumber] = useState(initialData?.policyNumber || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !insuranceType.trim()) return;

    onSubmit({
      memberId,
      insuranceType: insuranceType.trim(),
      providerName: providerName.trim() || undefined,
      policyNumber: policyNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setInsuranceType('');
      setProviderName('');
      setPolicyNumber('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ins-member" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー
        </label>
        <select
          id="ins-member"
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
        <label htmlFor="ins-type" className="block text-sm font-medium text-gray-700 mb-1">
          保険の種類
        </label>
        <input
          id="ins-type"
          type="text"
          value={insuranceType}
          onChange={(e) => setInsuranceType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="例: ガン保険、生命保険、医療保険"
        />
      </div>

      <div>
        <label htmlFor="ins-provider" className="block text-sm font-medium text-gray-700 mb-1">
          保険会社名（任意）
        </label>
        <input
          id="ins-provider"
          type="text"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="保険会社名を入力"
        />
      </div>

      <div>
        <label htmlFor="ins-policy" className="block text-sm font-medium text-gray-700 mb-1">
          証券番号（任意）
        </label>
        <input
          id="ins-policy"
          type="text"
          value={policyNumber}
          onChange={(e) => setPolicyNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="証券番号を入力"
        />
      </div>

      <div>
        <label htmlFor="ins-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="ins-notes"
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
