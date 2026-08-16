import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { CreateRecordInput } from "../model/history";

interface MedicationOption {
  id: string;
  name: string;
  memberId: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface AddPastRecordFormProps {
  selectedDate: string;
  members: MemberOption[];
  fetchMedicationsByMember: (memberId: string) => Promise<MedicationOption[]>;
  onSubmit: (input: CreateRecordInput) => Promise<void>;
  onClose: () => void;
}

export const AddPastRecordForm: React.FC<AddPastRecordFormProps> = ({
  selectedDate,
  members,
  fetchMedicationsByMember,
  onSubmit,
  onClose,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMemberId) {
      setMedications([]);
      setSelectedMedicationIds([]);
      return;
    }
    fetchMedicationsByMember(selectedMemberId)
      .then((data) => {
        setMedications(data);
        setSelectedMedicationIds([]);
      })
      .catch(() => {
        setMedications([]);
      });
  }, [selectedMemberId, fetchMedicationsByMember]);

  const toggleMedication = (medicationId: string) => {
    setSelectedMedicationIds((prev) =>
      prev.includes(medicationId) ? prev.filter((id) => id !== medicationId) : [...prev, medicationId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || selectedMedicationIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const takenAt = new Date(`${selectedDate}T12:00:00`).toISOString();
      const results = await Promise.allSettled(
        selectedMedicationIds.map((medicationId) =>
          onSubmit({
            memberId: selectedMemberId,
            medicationId,
            takenAt,
            notes: notes.trim() || undefined,
          }),
        ),
      );
      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        const successCount = results.length - failedCount;
        if (successCount > 0) {
          setError(`${successCount}件追加、${failedCount}件失敗しました`);
        } else {
          setError("記録の追加に失敗しました");
        }
        return;
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (dateKey: string) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    return `${y}年${m}月${d}日`;
  };

  return (
    <div className="bg-white rounded-lg border border-primary-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-ink-700">{formatDisplayDate(selectedDate)} の記録を追加</h4>
        <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink-600" aria-label="閉じる">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="past-record-member" className="block text-xs font-medium text-ink-600 mb-1">
            メンバー
          </label>
          <select
            id="past-record-member"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full rounded-md border border-primary-200 px-3 py-2 text-sm"
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

        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">お薬（複数選択可）</label>
          {!selectedMemberId ? (
            <p className="text-sm text-ink-400 py-2">メンバーを先に選択</p>
          ) : medications.length === 0 ? (
            <p className="text-sm text-ink-400 py-2">登録されたお薬がありません</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-primary-200 p-2">
              {medications.map((med) => (
                <label
                  key={med.id}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                    selectedMedicationIds.includes(med.id) ? "bg-primary-50 text-primary-700" : "hover:bg-primary-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMedicationIds.includes(med.id)}
                    onChange={() => toggleMedication(med.id)}
                    className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                  />
                  {med.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="past-record-notes" className="block text-xs font-medium text-ink-600 mb-1">
            メモ（任意）
          </label>
          <input
            id="past-record-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-primary-200 px-3 py-2 text-sm"
            placeholder="メモを入力"
            maxLength={500}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !selectedMemberId || selectedMedicationIds.length === 0}
          className="w-full flex items-center justify-center space-x-1 bg-primary text-white rounded-md py-2 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>
            {isSubmitting
              ? "追加中..."
              : selectedMedicationIds.length > 1
                ? `${selectedMedicationIds.length}件の記録を追加`
                : "記録を追加"}
          </span>
        </button>
      </form>
    </div>
  );
};
