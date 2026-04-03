'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X, Calendar } from 'lucide-react';
import { Examination } from '../../domain/entities/Examination';
import { UpdateExaminationInput } from '../../domain/repositories/ExaminationRepository';
import { formatDateJP } from '../../domain/entities/DateFormat';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

interface ExaminationListProps {
  examinations: Examination[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdateExaminationInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const ExaminationList: React.FC<ExaminationListProps> = ({ examinations, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (examinations.length === 0) {
    return (
      <EmptyStatePrompt message="検査記録がありません" subMessage="上の＋ボタンから記録を追加できます" />
    );
  }

  return (
    <div className="space-y-2">
      {examinations.map((examination) => (
        <ExaminationCard key={examination.id} examination={examination} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface ExaminationCardProps {
  examination: Examination;
  onUpdate: (id: string, input: UpdateExaminationInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const ExaminationCard: React.FC<ExaminationCardProps> = React.memo(({ examination, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editType, setEditType] = useState(examination.examinationType);
  const [editDate, setEditDate] = useState(examination.examinedAt.toISOString().split('T')[0]);
  const [editNextDate, setEditNextDate] = useState(
    examination.nextScheduledDate ? examination.nextScheduledDate.toISOString().split('T')[0] : '',
  );
  const [editNotes, setEditNotes] = useState(examination.notes || '');

  const handleSave = async () => {
    if (!editType.trim() || !editDate) return;
    await onUpdate(examination.id, {
      examinationType: editType.trim(),
      examinedAt: new Date(editDate).toISOString(),
      nextScheduledDate: editNextDate ? new Date(editNextDate).toISOString() : null,
      notes: editNotes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditType(examination.examinationType);
    setEditDate(examination.examinedAt.toISOString().split('T')[0]);
    setEditNextDate(examination.nextScheduledDate ? examination.nextScheduledDate.toISOString().split('T')[0] : '');
    setEditNotes(examination.notes || '');
    setIsEditing(false);
  };

  const isNextDateUpcoming = examination.nextScheduledDate && examination.nextScheduledDate > new Date();
  const isNextDatePast = examination.nextScheduledDate && examination.nextScheduledDate <= new Date();

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">検査の種類</label>
          <input
            type="text"
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">検査日</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">次回検査日</label>
          <input
            type="date"
            value={editNextDate}
            onChange={(e) => setEditNextDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">メモ</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!editType.trim() || !editDate}
            className="flex-1 flex items-center justify-center space-x-1 bg-primary-600 text-white py-1.5 rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            <span>保存</span>
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition-colors"
          >
            <X size={14} />
            <span>キャンセル</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-3 border border-pink-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-gray-800 text-sm">{examination.examinationType}</p>
            {examination.memberName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{examination.memberName}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <p className="flex items-center space-x-1">
              <Calendar size={10} />
              <span>検査日: {formatDateJP(examination.examinedAt)}</span>
            </p>
            {examination.nextScheduledDate && (
              <p className={`flex items-center space-x-1 ${isNextDatePast ? 'text-red-500 font-medium' : isNextDateUpcoming ? 'text-primary-500' : ''}`}>
                <Calendar size={10} />
                <span>次回予定: {formatDateJP(examination.nextScheduledDate)}</span>
                {isNextDatePast && <span>(期限切れ)</span>}
              </p>
            )}
            {examination.notes && <p className="text-gray-400">{examination.notes}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-primary-500 p-1 transition-colors"
            aria-label="編集"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
            aria-label="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
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

ExaminationCard.displayName = 'ExaminationCard';
