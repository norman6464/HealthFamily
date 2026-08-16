import React, { useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import type { Member } from '@/shared/api';

export interface ExaminationFormData {
  memberId: string;
  examinationType: string;
  examinedAt: string;
  nextScheduledDate?: string;
  notes?: string;
  imageData?: string;
}

interface ExaminationFormProps {
  members: Member[];
  onSubmit: (data: ExaminationFormData) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    examinationType: string;
    examinedAt: string;
    nextScheduledDate?: string | null;
    notes?: string | null;
    imageData?: string | null;
  };
}

const toDateInput = (value: string | null | undefined): string => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const todayInput = (): string => new Date().toISOString().split('T')[0];

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
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ExaminationForm: React.FC<ExaminationFormProps> = ({
  members,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [memberId, setMemberId] = useState(
    initialData?.memberId || (members.length === 1 ? members[0].id : ''),
  );
  const [examinationType, setExaminationType] = useState(initialData?.examinationType || '');
  const [examinedAt, setExaminedAt] = useState(
    initialData?.examinedAt ? toDateInput(initialData.examinedAt) : todayInput(),
  );
  const [nextScheduledDate, setNextScheduledDate] = useState(
    toDateInput(initialData?.nextScheduledDate),
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [imageData, setImageData] = useState<string | null>(initialData?.imageData ?? null);
  const [imageError, setImageError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setImageError('10MB以下の画像を選択してください');
      return;
    }
    setImageError('');
    try {
      const compressed = await compressImage(file);
      if (compressed.length > 1_500_000) {
        setImageError('画像を圧縮できませんでした。より小さい画像を選択してください');
        return;
      }
      setImageData(compressed);
    } catch {
      setImageError('画像の読み込みに失敗しました');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !examinationType.trim() || !examinedAt) return;
    if (isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        memberId,
        examinationType: examinationType.trim(),
        examinedAt: new Date(examinedAt).toISOString(),
        nextScheduledDate: nextScheduledDate
          ? new Date(nextScheduledDate).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
        imageData: imageData ?? undefined,
      });

      if (!initialData) {
        setExaminationType('');
        setExaminedAt(todayInput());
        setNextScheduledDate('');
        setNotes('');
        setImageData(null);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 候補が1人しかいないなら選ばせる意味が無い。
          メンバー詳細から開いたフォームは常にその1人に限られる */}
      {members.length > 1 && (
        <div>
          <label htmlFor="exam-member" className="block text-sm font-medium text-ink-700 mb-1">
            メンバー
          </label>
          <select
            id="exam-member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
      )}

      <div>
        <label htmlFor="exam-type" className="block text-sm font-medium text-ink-700 mb-1">
          検査の種類
        </label>
        <input
          id="exam-type"
          type="text"
          value={examinationType}
          onChange={(e) => setExaminationType(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
          placeholder="例: 健康診断、血液検査、耐性検査"
        />
      </div>

      <div>
        <label htmlFor="exam-date" className="block text-sm font-medium text-ink-700 mb-1">
          検査日
        </label>
        <input
          id="exam-date"
          type="date"
          value={examinedAt}
          onChange={(e) => setExaminedAt(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="exam-next" className="block text-sm font-medium text-ink-700 mb-1">
          次回検査日（任意）
        </label>
        <input
          id="exam-next"
          type="date"
          value={nextScheduledDate}
          onChange={(e) => setNextScheduledDate(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label htmlFor="exam-notes" className="block text-sm font-medium text-ink-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="exam-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder="例: 耐性あり ベンジルペニシリン / 異常なし"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-ink-700 mb-1">検査結果の画像（任意）</span>
        {imageData ? (
          <div className="relative">
            <img
              src={imageData}
              alt="検査結果"
              className="w-full rounded-lg border border-primary-100 max-h-52 object-contain bg-primary-50"
            />
            <button
              type="button"
              onClick={() => setImageData(null)}
              className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5 text-ink-500 hover:text-red-500 shadow transition-colors"
              aria-label="画像を削除"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-primary-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors text-sm text-ink-500">
            <ImagePlus size={16} className="text-ink-400" />
            <span>画像を追加</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
          </label>
        )}
        {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
      </div>

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '送信中...' : initialData ? '更新する' : '登録する'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-primary-50 text-ink-700 py-2 px-4 rounded-lg hover:bg-primary-100 transition-colors font-medium disabled:opacity-60"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
