import React, { useState } from 'react';
import { MemberType, PetType, Member } from '../../domain/entities/Member';

export interface MemberFormData {
  name: string;
  memberType: MemberType;
  petType?: PetType;
  birthDate?: string;
  notes?: string;
}

interface MemberFormProps {
  onSubmit: (data: MemberFormData) => void;
  initialData?: Member;
  onCancel?: () => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [memberType, setMemberType] = useState<MemberType>(initialData?.memberType || 'human');
  const [petType, setPetType] = useState<PetType>(initialData?.petType || 'dog');
  const [birthDate, setBirthDate] = useState(
    initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const data: MemberFormData = {
      name: name.trim(),
      memberType,
      ...(memberType === 'pet' ? { petType } : {}),
      ...(birthDate ? { birthDate } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    onSubmit(data);

    if (!isEditing) {
      setName('');
      setMemberType('human');
      setPetType('dog');
      setBirthDate('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="member-name" className="block text-sm font-medium text-gray-700 mb-1">
          名前
        </label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="名前を入力"
        />
      </div>

      {!isEditing && (
        <div>
          <label htmlFor="member-type" className="block text-sm font-medium text-gray-700 mb-1">
            タイプ
          </label>
          <select
            id="member-type"
            value={memberType}
            onChange={(e) => setMemberType(e.target.value as MemberType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="human">家族</option>
            <option value="pet">ペット</option>
          </select>
        </div>
      )}

      {memberType === 'pet' && (
        <div>
          <label htmlFor="pet-type" className="block text-sm font-medium text-gray-700 mb-1">
            ペットの種類
          </label>
          <select
            id="pet-type"
            value={petType}
            onChange={(e) => setPetType(e.target.value as PetType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dog">犬</option>
            <option value="cat">猫</option>
            <option value="rabbit">うさぎ</option>
            <option value="bird">鳥</option>
            <option value="other">その他</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="birth-date" className="block text-sm font-medium text-gray-700 mb-1">
          生年月日
        </label>
        <input
          id="birth-date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="member-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ
        </label>
        <textarea
          id="member-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="メモを入力（任意）"
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {isEditing ? '更新する' : '追加する'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
