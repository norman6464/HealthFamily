'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface NotificationToastProps {
  message: string;
  type: ToastType;
  onClose?: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-green-300 bg-green-50 text-green-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  info: 'border-blue-300 bg-blue-50 text-blue-800',
};

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  error: <XCircle className="h-5 w-5 text-red-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

export function NotificationToast({
  message,
  type,
  onClose,
}: NotificationToastProps) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${typeStyles[type]}`}>
      {typeIcons[type]}
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="rounded-full p-1 hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
