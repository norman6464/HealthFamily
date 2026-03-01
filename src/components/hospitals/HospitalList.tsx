'use client';

import React, { useState } from 'react';
import { MapPin, Pencil, Trash2, Phone, Check, X } from 'lucide-react';
import { Hospital } from '../../domain/entities/Hospital';
import { UpdateHospitalInput } from '../../domain/repositories/HospitalRepository';

interface HospitalListProps {
  hospitals: Hospital[];
  isLoading: boolean;
  onUpdate: (hospitalId: string, input: UpdateHospitalInput) => Promise<void>;
  onDelete: (hospitalId: string) => void;
}

export const HospitalList: React.FC<HospitalListProps> = ({ hospitals, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">病院が登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hospitals.map((hospital) => (
        <HospitalCard key={hospital.id} hospital={hospital} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface HospitalCardProps {
  hospital: Hospital;
  onUpdate: (hospitalId: string, input: UpdateHospitalInput) => Promise<void>;
  onDelete: (hospitalId: string) => void;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(hospital.name);
  const [editAddress, setEditAddress] = useState(hospital.address || '');
  const [editPhone, setEditPhone] = useState(hospital.phoneNumber || '');
  const [editNotes, setEditNotes] = useState(hospital.notes || '');

  const handleSave = async () => {
    if (!editName.trim()) return;
    await onUpdate(hospital.id, {
      name: editName.trim(),
      address: editAddress.trim() || undefined,
      phone: editPhone.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(hospital.name);
    setEditAddress(hospital.address || '');
    setEditPhone(hospital.phoneNumber || '');
    setEditNotes(hospital.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-200 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">病院名</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">住所</label>
          <input
            type="text"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="住所を入力"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">電話番号</label>
          <input
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="電話番号を入力"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">メモ</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="メモを入力"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!editName.trim()}
            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
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
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            <MapPin size={18} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm">{hospital.name}</p>
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              {hospital.address && <p>{hospital.address}</p>}
              {hospital.phoneNumber && (
                <p className="flex items-center space-x-1">
                  <Phone size={10} />
                  <span>{hospital.phoneNumber}</span>
                </p>
              )}
              {hospital.notes && <p className="text-gray-400">{hospital.notes}</p>}
            </div>
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
            onClick={() => onDelete(hospital.id)}
            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
            aria-label="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
