import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, Check, X, QrCode, PillBottle } from "lucide-react";
import type { Medication, Prescription } from "@/lib/types";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyStatePrompt } from "@/components/shared/EmptyStatePrompt";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { formatDateShort } from "@/lib/format";

export type PrescriptionWithMember = Prescription & { memberName?: string };

export interface UpdatePrescriptionInput {
  prescriptionName?: string;
  prescribedBy?: string | null;
  pharmacyName?: string | null;
  notes?: string | null;
}

interface PrescriptionListProps {
  prescriptions: PrescriptionWithMember[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdatePrescriptionInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions,
  isLoading,
  onUpdate,
  onDelete,
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (prescriptions.length === 0) {
    return <EmptyStatePrompt message="処方箋が登録されていません" subMessage="上の＋ボタンから処方箋を追加できます" />;
  }

  return (
    <div className="space-y-2">
      {prescriptions.map((p) => (
        <PrescriptionCard key={p.id} prescription={p} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface PrescriptionCardProps {
  prescription: PrescriptionWithMember;
  onUpdate: (id: string, input: UpdatePrescriptionInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = React.memo(({ prescription, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [editName, setEditName] = useState(prescription.prescriptionName);
  const [editDoctor, setEditDoctor] = useState(prescription.prescribedBy || "");
  const [editPharmacy, setEditPharmacy] = useState(prescription.pharmacyName || "");
  const [editNotes, setEditNotes] = useState(prescription.notes || "");

  const registerMedicationMutation = useMutation({
    mutationFn: () =>
      api.post<Medication>("/medications", {
        memberId: prescription.memberId,
        name: prescription.prescriptionName,
      }),
  });

  const now = new Date();
  const expiresDate = prescription.expiresAt ? new Date(prescription.expiresAt) : null;
  const isExpired = expiresDate && expiresDate < now;
  const isExpiringSoon =
    !isExpired && expiresDate && expiresDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

  const handleSave = async () => {
    if (!editName.trim()) return;
    await onUpdate(prescription.id, {
      prescriptionName: editName.trim(),
      prescribedBy: editDoctor.trim() || null,
      pharmacyName: editPharmacy.trim() || null,
      notes: editNotes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(prescription.prescriptionName);
    setEditDoctor(prescription.prescribedBy || "");
    setEditPharmacy(prescription.pharmacyName || "");
    setEditNotes(prescription.notes || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-ink-500 mb-1">処方箋名</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">処方医</label>
          <input
            type="text"
            value={editDoctor}
            onChange={(e) => setEditDoctor(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">薬局名</label>
          <input
            type="text"
            value={editPharmacy}
            onChange={(e) => setEditPharmacy(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">メモ</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!editName.trim()}
            className="flex-1 flex items-center justify-center space-x-1 bg-primary text-white py-1.5 rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            <span>保存</span>
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center space-x-1 bg-primary-50 text-ink-700 py-1.5 rounded-lg text-sm hover:bg-primary-100 transition-colors"
          >
            <X size={14} />
            <span>キャンセル</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <p className="font-medium text-ink-800 text-sm">{prescription.prescriptionName}</p>
            {isExpired && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">期限切れ</span>}
            {isExpiringSoon && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">期限間近</span>
            )}
            {prescription.memberName && (
              <span className="text-xs bg-primary-50 text-ink-600 px-1.5 py-0.5 rounded">{prescription.memberName}</span>
            )}
          </div>
          <div className="text-xs text-ink-500 mt-1 space-y-0.5">
            <p>処方日: {formatDateShort(prescription.prescribedAt)}</p>
            {prescription.prescribedBy && <p>処方医: {prescription.prescribedBy}</p>}
            {prescription.expiresAt && (
              <p>有効期限: {formatDateShort(prescription.expiresAt)}</p>
            )}
            {prescription.pharmacyName && <p>薬局: {prescription.pharmacyName}</p>}
            {prescription.notes && <p className="text-ink-400">{prescription.notes}</p>}
          </div>
          {prescription.electronicCode && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-2 py-1 rounded-md">
              <QrCode size={14} className="flex-shrink-0" />
              <span className="text-xs font-mono tracking-wide break-all">{prescription.electronicCode}</span>
            </div>
          )}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsRegisterDialogOpen(true)}
              disabled={registerMedicationMutation.isPending}
              className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors disabled:opacity-50"
            >
              <PillBottle size={14} />
              <span>{registerMedicationMutation.isPending ? "登録中..." : "この処方箋からお薬を登録"}</span>
            </button>
            {registerMedicationMutation.isSuccess && (
              <p className="mt-1 text-xs text-primary-600">お薬を登録しました</p>
            )}
            {registerMedicationMutation.isError && (
              <p className="mt-1 text-xs text-red-600">登録に失敗しました。もう一度お試しください</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="text-ink-400 hover:text-primary-500 p-1 transition-colors"
            aria-label="編集"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-ink-400 hover:text-red-500 p-1 transition-colors"
            aria-label="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <ConfirmationDialog
        title="処方箋の削除"
        message={`「${prescription.prescriptionName}」を削除しますか？この操作は取り消せません。`}
        isOpen={isDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete(prescription.id);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDangerous
      />
      <ConfirmationDialog
        title="お薬を登録"
        message={`「${prescription.prescriptionName}」を服薬管理のお薬として登録しますか？`}
        isOpen={isRegisterDialogOpen}
        onConfirm={() => {
          setIsRegisterDialogOpen(false);
          registerMedicationMutation.mutate();
        }}
        onCancel={() => setIsRegisterDialogOpen(false)}
      />
    </div>
  );
});

PrescriptionCard.displayName = "PrescriptionCard";
