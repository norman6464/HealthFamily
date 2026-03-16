import React, { useState } from 'react';
import { Pill, Check, Pencil, Clock } from 'lucide-react';
import { Medication } from '../../domain/entities/Medication';
import { MedicationViewModel } from '../../domain/usecases/ManageMedications';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface MedicationListProps {
  medications: MedicationViewModel[];
  isLoading: boolean;
  onDelete: (medicationId: string) => void;
  onMarkTaken?: (medicationId: string) => Promise<void>;
  onMarkPastTaken?: (medicationId: string, takenAt: string) => Promise<void>;
  onEdit?: (medication: Medication) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications, isLoading, onDelete, onMarkTaken, onMarkPastTaken, onEdit }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
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
        <MedicationCard key={vm.medication.id} viewModel={vm} onDelete={onDelete} onMarkTaken={onMarkTaken} onMarkPastTaken={onMarkPastTaken} onEdit={onEdit} />
      ))}
    </div>
  );
};

export interface MedicationCardProps {
  viewModel: MedicationViewModel;
  onDelete: (medicationId: string) => void;
  onMarkTaken?: (medicationId: string) => Promise<void>;
  onMarkPastTaken?: (medicationId: string, takenAt: string) => Promise<void>;
  onEdit?: (medication: Medication) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = React.memo(({ viewModel, onDelete, onMarkTaken, onMarkPastTaken, onEdit }) => {
  const { medication, isLowStock, displayInfo } = viewModel;
  const [isTaken, setIsTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPastRecordOpen, setIsPastRecordOpen] = useState(false);
  const [pastDate, setPastDate] = useState('');
  const [pastTime, setPastTime] = useState('12:00');
  const [isPastSubmitting, setIsPastSubmitting] = useState(false);
  const [pastRecordSuccess, setPastRecordSuccess] = useState(false);

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

  const handlePastRecordSubmit = async () => {
    if (!onMarkPastTaken || !pastDate || isPastSubmitting) return;
    setIsPastSubmitting(true);
    try {
      const takenAt = new Date(`${pastDate}T${pastTime}:00`).toISOString();
      await onMarkPastTaken(medication.id, takenAt);
      setPastRecordSuccess(true);
      setTimeout(() => {
        setIsPastRecordOpen(false);
        setPastRecordSuccess(false);
        setPastDate('');
        setPastTime('12:00');
      }, 1500);
    } finally {
      setIsPastSubmitting(false);
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
          {onMarkPastTaken && (
            <button
              onClick={() => setIsPastRecordOpen(true)}
              className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="過去の記録"
            >
              <Clock size={14} />
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
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
            aria-label="削除"
          >
            削除
          </button>
        </div>
      </div>
      <ConfirmationDialog
        title="薬の削除"
        message={`「${displayInfo.name}」を削除しますか？この操作は取り消せません。`}
        isOpen={isDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          onDelete(medication.id);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isDangerous
      />
      {isPastRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold">過去の服薬記録</h2>
            <p className="mb-4 text-sm text-gray-600">
              「{displayInfo.name}」の飲み忘れを記録します
            </p>
            {pastRecordSuccess ? (
              <div className="flex items-center justify-center py-4 text-green-600">
                <Check size={20} className="mr-2" />
                <span className="font-medium">記録しました</span>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                    <input
                      type="date"
                      value={pastDate}
                      onChange={(e) => setPastDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">時刻</label>
                    <input
                      type="time"
                      value={pastTime}
                      onChange={(e) => setPastTime(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPastRecordOpen(false);
                      setPastDate('');
                      setPastTime('12:00');
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handlePastRecordSubmit}
                    disabled={!pastDate || isPastSubmitting}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isPastSubmitting ? '記録中...' : '記録する'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

MedicationCard.displayName = 'MedicationCard';
