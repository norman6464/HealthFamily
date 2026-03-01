'use client';

import React, { useState } from 'react';
import { Check, MessageSquarePlus } from 'lucide-react';

interface TakeWithNotesButtonProps {
  medicationId: string;
  memberId: string;
  onTake: (memberId: string, medicationId: string, notes?: string) => Promise<void>;
}

export const TakeWithNotesButton: React.FC<TakeWithNotesButtonProps> = ({ medicationId, memberId, onTake }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const handleTake = async (withNotes: boolean) => {
    setIsSubmitting(true);
    try {
      await onTake(memberId, medicationId, withNotes && notes ? notes : undefined);
      setRecorded(true);
      setShowNotes(false);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recorded) {
    return (
      <span className="inline-flex items-center text-sm text-green-600">
        <Check size={16} className="mr-1" />
        記録済み
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {showNotes ? (
        <div className="flex items-center space-x-1">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="メモ（任意）"
            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <button
            onClick={() => handleTake(true)}
            disabled={isSubmitting}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
          >
            記録
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => handleTake(false)}
            disabled={isSubmitting}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            飲んだ
          </button>
          <button
            onClick={() => setShowNotes(true)}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="メモ付きで記録"
          >
            <MessageSquarePlus size={16} />
          </button>
        </>
      )}
    </div>
  );
};
