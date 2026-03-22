'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  memberId: string;
}

interface Member {
  id: string;
  name: string;
}

interface AddPastRecordFormProps {
  selectedDate: string;
  members: Member[];
  fetchMedicationsByMember: (memberId: string) => Promise<Medication[]>;
  onSubmit: (input: {
    memberId: string;
    medicationId: string;
    takenAt: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const AddPastRecordForm: React.FC<AddPastRecordFormProps> = ({
  selectedDate,
  members,
  fetchMedicationsByMember,
  onSubmit,
  onClose,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMedicationId, setSelectedMedicationId] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMemberId) {
      setMedications([]);
      setSelectedMedicationId('');
      return;
    }
    fetchMedicationsByMember(selectedMemberId)
      .then((data) => {
        setMedications(data);
        setSelectedMedicationId('');
      })
      .catch(() => {
        setMedications([]);
      });
  }, [selectedMemberId, fetchMedicationsByMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedMedicationId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const takenAt = new Date(`${selectedDate}T12:00:00`).toISOString();
      await onSubmit({
        memberId: selectedMemberId,
        medicationId: selectedMedicationId,
        takenAt,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      setError('記録の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return `${y}年${m}月${d}日`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">
          {formatDisplayDate(selectedDate)} の記録を追加
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="past-record-member" className="block text-xs font-medium text-gray-600 mb-1">
            メンバー
          </label>
          <select
            id="past-record-member"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          >
            <option value="">選択してください</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="past-record-medication" className="block text-xs font-medium text-gray-600 mb-1">
            お薬
          </label>
          <select
            id="past-record-medication"
            value={selectedMedicationId}
            onChange={(e) => setSelectedMedicationId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
            disabled={!selectedMemberId || medications.length === 0}
          >
            <option value="">
              {!selectedMemberId
                ? 'メンバーを先に選択'
                : medications.length === 0
                  ? '登録されたお薬がありません'
                  : '選択してください'}
            </option>
            {medications.map((med) => (
              <option key={med.id} value={med.id}>{med.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="past-record-notes" className="block text-xs font-medium text-gray-600 mb-1">
            メモ（任意）
          </label>
          <input
            id="past-record-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="メモを入力"
            maxLength={500}
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !selectedMemberId || !selectedMedicationId}
          className="w-full flex items-center justify-center space-x-1 bg-primary-600 text-white rounded-md py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>{isSubmitting ? '追加中...' : '記録を追加'}</span>
        </button>
      </form>
    </div>
  );
};
