import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStatePromptProps {
  message: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStatePrompt: React.FC<EmptyStatePromptProps> = ({ message, subMessage, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox size={40} className="text-gray-300 mb-3" />
      <p className="text-gray-500 text-sm font-medium">{message}</p>
      {subMessage && <p className="text-gray-400 text-xs mt-1">{subMessage}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
