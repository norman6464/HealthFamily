'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Allergy } from '../../domain/entities/Allergy';
import { UpdateAllergyInput } from '../../domain/repositories/AllergyRepository';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

const ALLERGY_TYPE_LABELS: Record<string, string> = {
  food: '食物',
  medication: '薬物',
  environmental: '環境',
  pollen: '花粉',
  atopy: 'アトピー',
  other: 'その他',
};

const SEVERITY_LABELS: Record<string, string> = {
  mild: '軽度',
  moderate: '中度',
  severe: '重度',
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  severe: 'bg-red-100 text-red-700',
};

interface AllergyListProps {
  allergies: Allergy[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdateAllergyInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const AllergyList: React.FC<AllergyListProps> = ({ allergies, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (allergies.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <p className="text-gray-500 text-sm">アレルギーが登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allergies.map((allergy) => (
        <AllergyCard key={allergy.id} allergy={allergy} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface AllergyCardProps {
  allergy: Allergy;
  onUpdate: (id: string, input: UpdateAllergyInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const AllergyCard: React.FC<AllergyCardProps> = React.memo(({ allergy, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState(allergy.allergenName);
  const [editType, setEditType] = useState(allergy.allergyType);
  const [editSeverity, setEditSeverity] = useState(allergy.severity);
  const [editSymptoms, setEditSymptoms] = useState(allergy.symptoms || '');
  const [editNotes, setEditNotes] = useState(allergy.notes || '');

  const handleSave = async () => {
    if (!editName.trim() || !editType || !editSeverity) return;
    await onUpdate(allergy.id, {
      allergenName: editName.trim(),
      allergyType: editType,
      severity: editSeverity,
      symptoms: editSymptoms.trim() || null,
      notes: editNotes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(allergy.allergenName);
    setEditType(allergy.allergyType);
    setEditSeverity(allergy.severity);
    setEditSymptoms(allergy.symptoms || '');
    setEditNotes(allergy.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">アレルゲン名</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">種類</label>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            {Object.entries(ALLERGY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">重症度</label>
          <select
            value={editSeverity}
            onChange={(e) => setEditSeverity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">症状</label>
          <textarea
            value={editSymptoms}
            onChange={(e) => setEditSymptoms(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            rows={2}
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
            disabled={!editName.trim() || !editType || !editSeverity}
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
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <p className="font-medium text-gray-800 text-sm">{allergy.allergenName}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded ${SEVERITY_COLORS[allergy.severity] || 'bg-gray-100 text-gray-600'}`}>
              {SEVERITY_LABELS[allergy.severity] || allergy.severity}
            </span>
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {ALLERGY_TYPE_LABELS[allergy.allergyType] || allergy.allergyType}
            </span>
            {allergy.memberName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{allergy.memberName}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            {allergy.symptoms && <p>{allergy.symptoms}</p>}
            {allergy.diagnosedAt && (
              <p>診断日: {new Date(allergy.diagnosedAt).toLocaleDateString('ja-JP')}</p>
            )}
            {allergy.notes && <p className="text-gray-400">{allergy.notes}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-500 p-1 transition-colors"
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
        title="アレルギーの削除"
        message={`「${allergy.allergenName}」を削除しますか？この操作は取り消せません。`}
        isOpen={isDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete(allergy.id);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDangerous
      />
    </div>
  );
});

AllergyCard.displayName = 'AllergyCard';
