'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Prescription } from '../../domain/entities/Prescription';
import { UpdatePrescriptionInput } from '../../domain/repositories/PrescriptionRepository';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdatePrescriptionInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({ prescriptions, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <p className="text-gray-500 text-sm">処方箋が登録されていません</p>
      </div>
    );
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
  prescription: Prescription;
  onUpdate: (id: string, input: UpdatePrescriptionInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = React.memo(({ prescription, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(prescription.prescriptionName);
  const [editDoctor, setEditDoctor] = useState(prescription.prescribedBy || '');
  const [editPharmacy, setEditPharmacy] = useState(prescription.pharmacyName || '');
  const [editNotes, setEditNotes] = useState(prescription.notes || '');

  const now = new Date();
  const expiresDate = prescription.expiresAt ? new Date(prescription.expiresAt) : null;
  const isExpired = expiresDate && expiresDate < now;
  const isExpiringSoon = !isExpired && expiresDate && (expiresDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000;

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
    setEditDoctor(prescription.prescribedBy || '');
    setEditPharmacy(prescription.pharmacyName || '');
    setEditNotes(prescription.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">処方箋名</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">処方医</label>
          <input
            type="text"
            value={editDoctor}
            onChange={(e) => setEditDoctor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">薬局名</label>
          <input
            type="text"
            value={editPharmacy}
            onChange={(e) => setEditPharmacy(e.target.value)}
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
            disabled={!editName.trim()}
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
            <p className="font-medium text-gray-800 text-sm">{prescription.prescriptionName}</p>
            {isExpired && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">期限切れ</span>
            )}
            {isExpiringSoon && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">期限間近</span>
            )}
            {prescription.memberName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{prescription.memberName}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <p>処方日: {new Date(prescription.prescribedAt).toLocaleDateString('ja-JP')}</p>
            {prescription.prescribedBy && <p>処方医: {prescription.prescribedBy}</p>}
            {prescription.expiresAt && (
              <p>有効期限: {new Date(prescription.expiresAt).toLocaleDateString('ja-JP')}</p>
            )}
            {prescription.pharmacyName && <p>薬局: {prescription.pharmacyName}</p>}
            {prescription.notes && <p className="text-gray-400">{prescription.notes}</p>}
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
            onClick={() => onDelete(prescription.id)}
            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
            aria-label="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

PrescriptionCard.displayName = 'PrescriptionCard';
