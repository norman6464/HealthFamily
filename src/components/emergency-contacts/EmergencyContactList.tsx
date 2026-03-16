'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X, Phone } from 'lucide-react';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { UpdateEmergencyContactInput } from '../../domain/repositories/EmergencyContactRepository';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

interface EmergencyContactListProps {
  contacts: EmergencyContact[];
  isLoading: boolean;
  onUpdate: (id: string, input: UpdateEmergencyContactInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export const EmergencyContactList: React.FC<EmergencyContactListProps> = ({ contacts, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyStatePrompt message="緊急連絡先が登録されていません" subMessage="上の＋ボタンから連絡先を追加できます" />
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface ContactCardProps {
  contact: EmergencyContact;
  onUpdate: (id: string, input: UpdateEmergencyContactInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = React.memo(({ contact, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState(contact.contactName);
  const [editPhone, setEditPhone] = useState(contact.phoneNumber);
  const [editRelationship, setEditRelationship] = useState(contact.relationship || '');
  const [editNotes, setEditNotes] = useState(contact.notes || '');

  const handleSave = async () => {
    if (!editName.trim() || !editPhone.trim()) return;
    await onUpdate(contact.id, {
      contactName: editName.trim(),
      phoneNumber: editPhone.trim(),
      relationship: editRelationship.trim() || null,
      notes: editNotes.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(contact.contactName);
    setEditPhone(contact.phoneNumber);
    setEditRelationship(contact.relationship || '');
    setEditNotes(contact.notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">連絡先名</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">電話番号</label>
          <input
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">続柄</label>
          <input
            type="text"
            value={editRelationship}
            onChange={(e) => setEditRelationship(e.target.value)}
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
            disabled={!editName.trim() || !editPhone.trim()}
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
            <p className="font-medium text-gray-800 text-sm">{contact.contactName}</p>
            {contact.relationship && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{contact.relationship}</span>
            )}
            {contact.memberName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{contact.memberName}</span>
            )}
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <Phone size={12} className="text-gray-400" />
            <a href={`tel:${contact.phoneNumber}`} className="text-sm text-primary-600 hover:underline">
              {contact.phoneNumber}
            </a>
          </div>
          {contact.notes && (
            <p className="text-xs text-gray-400 mt-1">{contact.notes}</p>
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
        title="緊急連絡先の削除"
        message={`「${contact.contactName}」を削除しますか？この操作は取り消せません。`}
        isOpen={isDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete(contact.id);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDangerous
      />
    </div>
  );
});

ContactCard.displayName = 'ContactCard';
