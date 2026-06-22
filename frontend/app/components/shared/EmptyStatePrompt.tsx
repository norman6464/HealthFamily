import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStatePromptProps {
  message: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStatePrompt: React.FC<EmptyStatePromptProps> = ({
  message,
  subMessage,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox size={40} className="text-primary-200 mb-3" />
      <p className="text-ink-500 text-sm font-medium">{message}</p>
      {subMessage && <p className="text-ink-400 text-xs mt-1">{subMessage}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary-dark transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
