import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface MedicationInteractionAlertProps {
  medicationNames: string[];
  message: string;
  onDismiss?: () => void;
}

export const MedicationInteractionAlert: React.FC<MedicationInteractionAlertProps> = ({ medicationNames, message, onDismiss }) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
      <div className="flex items-start space-x-2">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800 font-medium">{message}</p>
          <p className="text-xs text-amber-600 mt-1">
            {medicationNames.join('、')}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-amber-600 transition-colors"
            aria-label="閉じる"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
