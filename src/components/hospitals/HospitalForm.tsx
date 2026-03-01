'use client';

import React, { useState } from 'react';

export interface HospitalFormData {
  name: string;
  address?: string;
  phone?: string;
  notes?: string;
}

interface HospitalFormProps {
  onSubmit: (data: HospitalFormData) => void;
}

export const HospitalForm: React.FC<HospitalFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setAddress('');
    setPhone('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="hosp-name" className="block text-sm font-medium text-gray-700 mb-1">
          病院名
        </label>
        <input
          id="hosp-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="病院名を入力"
        />
      </div>

      <div>
        <label htmlFor="hosp-address" className="block text-sm font-medium text-gray-700 mb-1">
          住所（任意）
        </label>
        <input
          id="hosp-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="住所を入力"
        />
      </div>

      <div>
        <label htmlFor="hosp-phone" className="block text-sm font-medium text-gray-700 mb-1">
          電話番号（任意）
        </label>
        <input
          id="hosp-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="電話番号を入力"
        />
      </div>

      <div>
        <label htmlFor="hosp-notes" className="block text-sm font-medium text-gray-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="hosp-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="メモを入力"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        追加する
      </button>
    </form>
  );
};
