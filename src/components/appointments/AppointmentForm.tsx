'use client';

import React, { useState } from 'react';
import { Member, MemberEntity } from '../../domain/entities/Member';
import { Appointment, Hospital } from '../../domain/entities/Appointment';
import { AppointmentEntity } from '../../domain/entities/Appointment';
import { MemberIcon } from '../shared/MemberIcon';

export interface AppointmentFormData {
  memberId: string;
  hospitalId?: string;
  appointmentDate: string;
  type?: string;
  notes?: string;
}

interface AppointmentFormProps {
  members: Member[];
  hospitals: Hospital[];
  onSubmit: (data: AppointmentFormData) => void;
  initialData?: Appointment;
  onCancel?: () => void;
}

const formatDateForInput = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ members, hospitals, onSubmit, initialData, onCancel }) => {
  const isEditing = !!initialData;
  const [memberId, setMemberId] = useState(initialData?.memberId || members[0]?.id || '');
  const [hospitalId, setHospitalId] = useState(initialData?.hospitalId || '');
  const [appointmentDate, setAppointmentDate] = useState(
    initialData ? formatDateForInput(initialData.appointmentDate) : ''
  );
  const [type, setType] = useState(initialData?.appointmentType || '');
  const [notes, setNotes] = useState(initialData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !appointmentDate) return;

    onSubmit({
      memberId,
      hospitalId: hospitalId || undefined,
      appointmentDate,
      type: type || undefined,
      notes: notes.trim() || undefined,
    });

    if (!isEditing) {
      setAppointmentDate('');
      setType('');
      setNotes('');
    }
  };

  const typeOptions = Object.entries(AppointmentEntity.typeLabels);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="apt-member" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー
        </label>
        <div className="space-y-1">
          {members.map((m) => {
            const entity = new MemberEntity(m);
            const info = entity.getDisplayInfo();
            const isSelected = memberId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMemberId(m.id)}
                disabled={isEditing}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <MemberIcon memberType={info.memberType} petType={info.petType} size={16} className="text-gray-600" />
                <span className="text-sm">{info.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="apt-date" className="block text-sm font-medium text-gray-700 mb-1">
          予約日
        </label>
        <input
          id="apt-date"
          type="date"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {hospitals.length > 0 && (
        <div>
          <label htmlFor="apt-hospital" className="block text-sm font-medium text-gray-700 mb-1">
            病院（任意）
          </label>
          <select
            id="apt-hospital"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            disabled={isEditing}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <option value="">選択しない</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="apt-type" className="block text-sm font-medium text-gray-700 mb-1">
          種別（任意）
        </label>
        <select
          id="apt-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">選択しない</option>
          {typeOptions.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="apt-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="apt-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="メモを入力"
        />
      </div>

      <div className={isEditing ? 'flex space-x-2' : ''}>
        <button
          type="submit"
          className={`${isEditing ? 'flex-1' : 'w-full'} bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium`}
        >
          {isEditing ? '更新する' : '追加する'}
        </button>
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
