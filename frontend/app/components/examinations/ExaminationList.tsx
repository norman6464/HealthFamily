import React, { useState } from "react";
import { Pencil, Trash2, Check, X, Calendar, ImagePlus } from "lucide-react";
import type { Examination } from "@/lib/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyStatePrompt } from "@/components/shared/EmptyStatePrompt";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

export type ExaminationWithMember = Examination & { memberName?: string };

export interface UpdateExaminationInput {
  examinationType?: string;
  examinedAt?: string;
  nextScheduledDate?: string | null;
  notes?: string | null;
  imageData?: string | null;
}

const formatDateJP = (value: string): string =>
  new Date(value).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

const toDateInput = (value: string | null | undefined): string => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

interface ExaminationListProps {
  examinations: ExaminationWithMember[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdateExaminationInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const ExaminationList: React.FC<ExaminationListProps> = ({ examinations, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (examinations.length === 0) {
    return <EmptyStatePrompt message="検査記録がありません" subMessage="上の＋ボタンから記録を追加できます" />;
  }

  return (
    <div className="space-y-2">
      {examinations.map((examination) => (
        <ExaminationCard key={examination.id} examination={examination} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_DIM);
            width = MAX_DIM;
          } else {
            width = Math.round((width / height) * MAX_DIM);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ExaminationCardProps {
  examination: ExaminationWithMember;
  onUpdate: (id: string, input: UpdateExaminationInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const ExaminationCard: React.FC<ExaminationCardProps> = React.memo(({ examination, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [editType, setEditType] = useState(examination.examinationType);
  const [editDate, setEditDate] = useState(toDateInput(examination.examinedAt));
  const [editNextDate, setEditNextDate] = useState(toDateInput(examination.nextScheduledDate));
  const [editNotes, setEditNotes] = useState(examination.notes || "");
  const [editImageData, setEditImageData] = useState<string | null>(examination.imageData ?? null);
  const [editImageError, setEditImageError] = useState("");

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setEditImageError("10MB以下の画像を選択してください");
      return;
    }
    setEditImageError("");
    try {
      const compressed = await compressImage(file);
      if (compressed.length > 1_500_000) {
        setEditImageError("画像を圧縮できませんでした。より小さい画像を選択してください");
        return;
      }
      setEditImageData(compressed);
    } catch {
      setEditImageError("画像の読み込みに失敗しました");
    }
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!editType.trim() || !editDate) return;
    await onUpdate(examination.id, {
      examinationType: editType.trim(),
      examinedAt: new Date(editDate).toISOString(),
      nextScheduledDate: editNextDate ? new Date(editNextDate).toISOString() : null,
      notes: editNotes.trim() || null,
      imageData: editImageData,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditType(examination.examinationType);
    setEditDate(toDateInput(examination.examinedAt));
    setEditNextDate(toDateInput(examination.nextScheduledDate));
    setEditNotes(examination.notes || "");
    setEditImageData(examination.imageData ?? null);
    setEditImageError("");
    setIsEditing(false);
  };

  const nextDate = examination.nextScheduledDate ? new Date(examination.nextScheduledDate) : null;
  const isNextDateUpcoming = nextDate && nextDate > new Date();
  const isNextDatePast = nextDate && nextDate <= new Date();

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-ink-500 mb-1">検査の種類</label>
          <input
            type="text"
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">検査日</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">次回検査日</label>
          <input
            type="date"
            value={editNextDate}
            onChange={(e) => setEditNextDate(e.target.value)}
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
        <div>
          <span className="block text-xs text-ink-500 mb-1">検査結果の画像</span>
          {editImageData ? (
            <div className="relative">
              <img
                src={editImageData}
                alt="検査結果"
                className="w-full rounded border border-primary-100 max-h-40 object-contain bg-primary-50"
              />
              <button
                type="button"
                onClick={() => setEditImageData(null)}
                className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-ink-500 hover:text-red-500 shadow"
                aria-label="画像を削除"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 py-2 px-3 border border-dashed border-primary-200 rounded cursor-pointer hover:border-primary-400 text-xs text-ink-500">
              <ImagePlus size={14} className="text-ink-400" />
              <span>画像を追加</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleEditImageChange} />
            </label>
          )}
          {editImageError && <p className="text-xs text-red-500 mt-1">{editImageError}</p>}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!editType.trim() || !editDate}
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
          <div className="flex items-center space-x-2">
            <p className="font-medium text-ink-800 text-sm">{examination.examinationType}</p>
            {examination.memberName && (
              <span className="text-xs bg-primary-50 text-ink-600 px-1.5 py-0.5 rounded">{examination.memberName}</span>
            )}
          </div>
          <div className="text-xs text-ink-500 mt-1 space-y-0.5">
            <p className="flex items-center space-x-1">
              <Calendar size={10} />
              <span>検査日: {formatDateJP(examination.examinedAt)}</span>
            </p>
            {examination.nextScheduledDate && (
              <p
                className={`flex items-center space-x-1 ${
                  isNextDatePast ? "text-red-500 font-medium" : isNextDateUpcoming ? "text-primary-500" : ""
                }`}
              >
                <Calendar size={10} />
                <span>次回予定: {formatDateJP(examination.nextScheduledDate)}</span>
                {isNextDatePast && <span>(期限切れ)</span>}
              </p>
            )}
            {examination.notes && <p className="text-ink-400 whitespace-pre-wrap">{examination.notes}</p>}
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

      {examination.imageData && (
        <div className="mt-2">
          <img
            src={examination.imageData}
            alt="検査結果画像"
            className={`w-full rounded border border-primary-100 object-contain bg-primary-50 cursor-pointer transition-all ${
              showFullImage ? "max-h-none" : "max-h-32"
            }`}
            onClick={() => setShowFullImage((v) => !v)}
            title={showFullImage ? "タップで縮小" : "タップで拡大"}
          />
        </div>
      )}

      <ConfirmationDialog
        title="検査記録の削除"
        message={`「${examination.examinationType}」を削除しますか？この操作は取り消せません。`}
        isOpen={isDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete(examination.id);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDangerous
      />
    </div>
  );
});

ExaminationCard.displayName = "ExaminationCard";
