'use client';

import { Check, X, AlertTriangle } from 'lucide-react';

interface MedicationDosageChipProps {
  medicationName: string;
  dosage: string;
  isTaken?: boolean;
  isLowStock?: boolean;
  onRemove?: () => void;
}

export function MedicationDosageChip({
  medicationName,
  dosage,
  isTaken = false,
  isLowStock = false,
  onRemove,
}: MedicationDosageChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
        isTaken ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      {isTaken && <Check className="h-4 w-4 text-green-600" />}
      <span className="text-sm font-medium">{medicationName}</span>
      <span className="text-sm text-gray-500">{dosage}</span>
      {isLowStock && (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          在庫少
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="削除"
          className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
