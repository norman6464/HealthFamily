import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Check, X, QrCode, PillBottle, Plus, ListChecks } from "lucide-react";
import type { Medication, Prescription, PrescriptionItem } from "@/shared/api";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import { LoadingSpinner } from "@/shared/ui";
import { EmptyStatePrompt } from "@/shared/ui";
import { ConfirmationDialog } from "@/shared/ui";
import { formatDateShort } from "@/shared/lib";

// 処方明細の編集用ローカル行（入力中は文字列で保持し、保存時に整形する）
interface ItemDraft {
  name: string;
  dosage: string;
  frequency: string;
  days: string;
}

interface SaveItemsPayload {
  name: string;
  dosage?: string;
  frequency?: string;
  days?: number;
}

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

const itemToDraft = (item: PrescriptionItem): ItemDraft => ({
  name: item.name,
  dosage: item.dosage ?? "",
  frequency: item.frequency ?? "",
  days: item.days != null ? String(item.days) : "",
});

const PrescriptionCard: React.FC<PrescriptionCardProps> = React.memo(({ prescription, onUpdate, onDelete }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = useState(false);
  const [editName, setEditName] = useState(prescription.prescriptionName);
  const [editDoctor, setEditDoctor] = useState(prescription.prescribedBy || "");
  const [editPharmacy, setEditPharmacy] = useState(prescription.pharmacyName || "");
  const [editNotes, setEditNotes] = useState(prescription.notes || "");

  const [isEditingItems, setIsEditingItems] = useState(false);
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([]);

  const registerMedicationMutation = useMutation({
    mutationFn: () =>
      api.post<Medication>("/medications", {
        memberId: prescription.memberId,
        name: prescription.prescriptionName,
      }),
  });

  const saveItemsMutation = useMutation({
    mutationFn: (items: SaveItemsPayload[]) =>
      api.put<Prescription>(`/prescriptions/${prescription.id}/items`, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all });
      setIsEditingItems(false);
    },
  });

  const dispenseMutation = useMutation({
    mutationFn: () => api.post<Medication[]>(`/prescriptions/${prescription.id}/dispense`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });

  const startEditingItems = () => {
    const drafts = prescription.items.length > 0 ? prescription.items.map(itemToDraft) : [{ name: "", dosage: "", frequency: "", days: "" }];
    setItemDrafts(drafts);
    setIsEditingItems(true);
  };

  const updateItemDraft = (index: number, field: keyof ItemDraft, value: string) => {
    setItemDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const addItemDraft = () => {
    setItemDrafts((prev) => [...prev, { name: "", dosage: "", frequency: "", days: "" }]);
  };

  const removeItemDraft = (index: number) => {
    setItemDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const validItemDrafts = itemDrafts.filter((d) => d.name.trim() !== "");

  const handleSaveItems = () => {
    const items: SaveItemsPayload[] = validItemDrafts.map((d) => {
      const payload: SaveItemsPayload = { name: d.name.trim() };
      if (d.dosage.trim()) payload.dosage = d.dosage.trim();
      if (d.frequency.trim()) payload.frequency = d.frequency.trim();
      const daysNum = Number(d.days.trim());
      if (d.days.trim() && Number.isFinite(daysNum)) payload.days = daysNum;
      return payload;
    });
    saveItemsMutation.mutate(items);
  };

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

          {/* 処方明細セクション */}
          <div className="mt-3 border-t border-primary-100 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-700">処方明細</p>
              {!isEditingItems && (
                <button
                  type="button"
                  onClick={startEditingItems}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Pencil size={12} />
                  <span>明細を編集</span>
                </button>
              )}
            </div>

            {!isEditingItems && (
              <>
                {prescription.items.length === 0 ? (
                  <p className="mt-1 text-xs text-ink-400">明細はまだ登録されていません</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {prescription.items.map((item) => (
                      <li key={item.id} className="text-xs text-ink-600">
                        <span className="font-medium text-ink-700">{item.name}</span>
                        {(item.dosage || item.frequency || item.days != null) && (
                          <span className="text-ink-400">
                            {" "}
                            {[item.dosage, item.frequency, item.days != null ? `${item.days}日分` : null]
                              .filter(Boolean)
                              .join(" / ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {prescription.items.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setIsDispenseDialogOpen(true)}
                      disabled={dispenseMutation.isPending}
                      className="inline-flex items-center gap-1 bg-primary text-white px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      <ListChecks size={14} />
                      <span>{dispenseMutation.isPending ? "登録中..." : "この処方明細からお薬を登録"}</span>
                    </button>
                    {dispenseMutation.isSuccess && (
                      <p className="mt-1 text-xs text-primary-600">
                        {dispenseMutation.data.length}件のお薬を登録しました
                      </p>
                    )}
                    {dispenseMutation.isError && (
                      <p className="mt-1 text-xs text-red-600">登録に失敗しました。もう一度お試しください</p>
                    )}
                  </div>
                )}
              </>
            )}

            {isEditingItems && (
              <div className="mt-2 space-y-2">
                {itemDrafts.map((draft, index) => (
                  <div key={index} className="rounded-lg border border-primary-200 p-2 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => updateItemDraft(index, "name", e.target.value)}
                        placeholder="薬名（必須）"
                        className="flex-1 px-2 py-1 border border-primary-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemDraft(index)}
                        className="text-ink-400 hover:text-red-500 p-1 transition-colors flex-shrink-0"
                        aria-label="明細行を削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        value={draft.dosage}
                        onChange={(e) => updateItemDraft(index, "dosage", e.target.value)}
                        placeholder="用量"
                        className="px-2 py-1 border border-primary-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        value={draft.frequency}
                        onChange={(e) => updateItemDraft(index, "frequency", e.target.value)}
                        placeholder="頻度"
                        className="px-2 py-1 border border-primary-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        min={0}
                        value={draft.days}
                        onChange={(e) => updateItemDraft(index, "days", e.target.value)}
                        placeholder="日数"
                        className="px-2 py-1 border border-primary-200 rounded text-xs focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItemDraft}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Plus size={14} />
                  <span>明細行を追加</span>
                </button>

                {saveItemsMutation.isError && (
                  <p className="text-xs text-red-600">保存に失敗しました。もう一度お試しください</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveItems}
                    disabled={saveItemsMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1 bg-primary text-white py-1.5 rounded-lg text-xs hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>{saveItemsMutation.isPending ? "保存中..." : "明細を保存"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingItems(false)}
                    disabled={saveItemsMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1 bg-primary-50 text-ink-700 py-1.5 rounded-lg text-xs hover:bg-primary-100 transition-colors disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>キャンセル</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
      <ConfirmationDialog
        title="明細からお薬を登録"
        message={`「${prescription.prescriptionName}」の処方明細（${prescription.items.length}件）から服薬管理のお薬を一括登録しますか？`}
        isOpen={isDispenseDialogOpen}
        onConfirm={() => {
          setIsDispenseDialogOpen(false);
          dispenseMutation.mutate();
        }}
        onCancel={() => setIsDispenseDialogOpen(false)}
      />
    </div>
  );
});

PrescriptionCard.displayName = "PrescriptionCard";
