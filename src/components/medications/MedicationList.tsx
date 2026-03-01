import React, { useState } from 'react';
import { Pill, Check, Pencil } from 'lucide-react';
import { Medication } from '../../domain/entities/Medication';
import { MedicationViewModel } from '../../domain/usecases/ManageMedications';

interface MedicationListProps {
  medications: MedicationViewModel[];
  isLoading: boolean;
  onDelete: (medicationId: string) => void;
  onMarkTaken?: (medicationId: string) => Promise<void>;
  onEdit?: (medication: Medication) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications, isLoading, onDelete, onMarkTaken, onEdit }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">薬がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {medications.map((vm) => (
        <MedicationCard key={vm.medication.id} viewModel={vm} onDelete={onDelete} onMarkTaken={onMarkTaken} onEdit={onEdit} />
      ))}
    </div>
  );
};

interface MedicationCardProps {
  viewModel: MedicationViewModel;
  onDelete: (medicationId: string) => void;
  onMarkTaken?: (medicationId: string) => Promise<void>;
  onEdit?: (medication: Medication) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ viewModel, onDelete, onMarkTaken, onEdit }) => {
  const { medication, isLowStock, displayInfo } = viewModel;
  const [isTaken, setIsTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkTaken = async () => {
    if (!onMarkTaken || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onMarkTaken(medication.id);
      setIsTaken(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Pill size={20} className="text-primary-600" />
            <p className="font-semibold text-gray-800">{displayInfo.name}</p>
            {isLowStock && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                在庫少
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-500 space-y-0.5">
            <p>{displayInfo.categoryLabel}</p>
            {displayInfo.dosageInfo && <p>{displayInfo.dosageInfo}</p>}
            {medication.stockQuantity !== undefined && (
              <p>在庫: {medication.stockQuantity}日分</p>
            )}
            {medication.stockAlertDate && (
              <p>警告日: {new Date(medication.stockAlertDate).toLocaleDateString('ja-JP')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(medication)}
              className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="編集"
            >
              <Pencil size={14} />
            </button>
          )}
          {onMarkTaken && (
            isTaken ? (
              <span className="flex items-center space-x-1 text-green-600 text-sm font-medium px-3 py-1">
                <Check size={16} />
                <span>記録済み</span>
              </span>
            ) : (
              <button
                onClick={handleMarkTaken}
                disabled={isSubmitting}
                className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                aria-label="飲んだ"
              >
                {isSubmitting ? '記録中...' : '飲んだ'}
              </button>
            )
          )}
          <button
            onClick={() => onDelete(medication.id)}
            className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
            aria-label="削除"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};
