import React from 'react';
import { MedicationViewModel } from '../../domain/usecases/ManageMedications';

interface MedicationListProps {
  medications: MedicationViewModel[];
  isLoading: boolean;
  onDelete: (medicationId: string) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications, isLoading, onDelete }) => {
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
        <MedicationCard key={vm.medication.id} viewModel={vm} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface MedicationCardProps {
  viewModel: MedicationViewModel;
  onDelete: (medicationId: string) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ viewModel, onDelete }) => {
  const { medication, isLowStock, displayInfo } = viewModel;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg">💊</span>
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
              <p>在庫: {medication.stockQuantity}個</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(medication.id)}
          className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          aria-label="削除"
        >
          削除
        </button>
      </div>
    </div>
  );
};
