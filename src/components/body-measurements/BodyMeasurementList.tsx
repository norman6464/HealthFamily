'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { BodyMeasurement } from '../../domain/entities/BodyMeasurement';
import { UpdateBodyMeasurementInput } from '../../domain/repositories/BodyMeasurementRepository';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

interface BodyMeasurementListProps {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdateBodyMeasurementInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const BodyMeasurementList: React.FC<BodyMeasurementListProps> = ({ measurements, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (measurements.length === 0) {
    return (
      <EmptyStatePrompt message="記録がありません" subMessage="上の＋ボタンから計測記録を追加できます" />
    );
  }

  return (
    <div className="space-y-2">
      {measurements.map((m) => (
        <MeasurementCard key={m.id} measurement={m} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface MeasurementCardProps {
  measurement: BodyMeasurement;
  onUpdate: (id: string, input: UpdateBodyMeasurementInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const MeasurementCard: React.FC<MeasurementCardProps> = React.memo(({ measurement, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editWeight, setEditWeight] = useState(measurement.weight?.toString() || '');
  const [editHeight, setEditHeight] = useState(measurement.height?.toString() || '');
  const [editNotes, setEditNotes] = useState(measurement.notes || '');

  const handleSave = async () => {
    const w = editWeight ? parseFloat(editWeight) : null;
    const h = editHeight ? parseFloat(editHeight) : null;
    if (w == null && h == null) return;
    await onUpdate(measurement.id, {
      weight: w,
      height: h,
      notes: editNotes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditWeight(measurement.weight?.toString() || '');
    setEditHeight(measurement.height?.toString() || '');
    setEditNotes(measurement.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">身長 (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={editHeight}
              onChange={(e) => setEditHeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
            disabled={!editWeight && !editHeight}
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
            <p className="text-xs text-gray-500">
              {new Date(measurement.recordedAt).toLocaleDateString('ja-JP')}
            </p>
            {measurement.memberName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{measurement.memberName}</span>
            )}
          </div>
          <div className="flex items-center space-x-3 mt-1">
            {measurement.weight != null && (
              <p className="font-medium text-gray-800 text-sm">
                体重: {measurement.weight} kg
              </p>
            )}
            {measurement.height != null && (
              <p className="font-medium text-gray-800 text-sm">
                身長: {measurement.height} cm
              </p>
            )}
          </div>
          {measurement.notes && (
            <p className="text-xs text-gray-400 mt-1">{measurement.notes}</p>
          )}
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
        title="計測記録の削除"
        message="この計測記録を削除しますか？この操作は取り消せません。"
        isOpen={isDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete(measurement.id);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDangerous
      />
    </div>
  );
});

MeasurementCard.displayName = 'MeasurementCard';
