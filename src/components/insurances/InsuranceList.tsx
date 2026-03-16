'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Insurance } from '../../domain/entities/Insurance';
import { UpdateInsuranceInput } from '../../domain/repositories/InsuranceRepository';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface InsuranceListProps {
  insurances: Insurance[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdateInsuranceInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const InsuranceList: React.FC<InsuranceListProps> = ({ insurances, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (insurances.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <p className="text-gray-500 text-sm">保険が登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insurances.map((insurance) => (
        <InsuranceCard key={insurance.id} insurance={insurance} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface InsuranceCardProps {
  insurance: Insurance;
  onUpdate: (id: string, input: UpdateInsuranceInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const InsuranceCard: React.FC<InsuranceCardProps> = React.memo(({ insurance, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState(insurance.insuranceType);
  const [editProvider, setEditProvider] = useState(insurance.providerName || '');
  const [editPolicy, setEditPolicy] = useState(insurance.policyNumber || '');
  const [editNotes, setEditNotes] = useState(insurance.notes || '');

  const handleSave = async () => {
    if (!editType.trim()) return;
    await onUpdate(insurance.id, {
      insuranceType: editType.trim(),
      providerName: editProvider.trim() || null,
      policyNumber: editPolicy.trim() || null,
      notes: editNotes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditType(insurance.insuranceType);
    setEditProvider(insurance.providerName || '');
    setEditPolicy(insurance.policyNumber || '');
    setEditNotes(insurance.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">保険の種類</label>
          <input
            type="text"
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">保険会社名</label>
          <input
            type="text"
            value={editProvider}
            onChange={(e) => setEditProvider(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            placeholder="保険会社名を入力"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">証券番号</label>
          <input
            type="text"
            value={editPolicy}
            onChange={(e) => setEditPolicy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            placeholder="証券番号を入力"
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
            disabled={!editType.trim()}
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
          <div className="flex items-center space-x-2">
            <p className="font-medium text-gray-800 text-sm">{insurance.insuranceType}</p>
            {insurance.memberName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{insurance.memberName}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            {insurance.providerName && <p>{insurance.providerName}</p>}
            {insurance.policyNumber && <p>証券番号: {insurance.policyNumber}</p>}
            {insurance.notes && <p className="text-gray-400">{insurance.notes}</p>}
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
            onClick={() => onDelete(insurance.id)}
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

InsuranceCard.displayName = 'InsuranceCard';
