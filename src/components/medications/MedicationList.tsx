import React, { useState } from 'react';
import { Pill, Check, Pencil, Clock, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Medication } from '../../domain/entities/Medication';
import { MedicationViewModel } from '../../domain/usecases/ManageMedications';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';

export interface MedicationScheduleInfo {
  scheduleId: string;
  time: string;
  label: string; // "毎日", "月・水・金", "21日毎" etc.
}

export interface MedicationScheduleMap {
  [medicationId: string]: MedicationScheduleInfo[];
}

interface MedicationListProps {
  medications: MedicationViewModel[];
  isLoading: boolean;
  onDelete: (medicationId: string) => void;
  onMarkTaken?: (medicationId: string) => Promise<void>;
  onMarkPastTaken?: (medicationId: string, takenAt: string) => Promise<void>;
  onEdit?: (medication: Medication) => void;
  onReorder?: (medicationIds: string[]) => Promise<void>;
  scheduleMap?: MedicationScheduleMap;
  scheduleEditUrl?: string;
}

export const MedicationList: React.FC<MedicationListProps> = ({ medications, isLoading, onDelete, onMarkTaken, onMarkPastTaken, onEdit, onReorder, scheduleMap, scheduleEditUrl }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (medications.length === 0) {
    return (
      <EmptyStatePrompt message="薬がまだ登録されていません" subMessage="メンバーページから薬を追加してください" />
    );
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!onReorder) return;
    const newList = [...medications];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    await onReorder(newList.map((vm) => vm.medication.id));
  };

  return (
    <div className="space-y-3">
      {medications.map((vm, index) => (
        <MedicationCard
          key={vm.medication.id}
          viewModel={vm}
          onDelete={onDelete}
          onMarkTaken={onMarkTaken}
          onMarkPastTaken={onMarkPastTaken}
          onEdit={onEdit}
          onMoveUp={onReorder && index > 0 ? () => handleMove(index, 'up') : undefined}
          onMoveDown={onReorder && index < medications.length - 1 ? () => handleMove(index, 'down') : undefined}
          schedules={scheduleMap?.[vm.medication.id]}
          scheduleEditUrl={scheduleEditUrl}
        />
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  schedules?: MedicationScheduleInfo[];
  scheduleEditUrl?: string;
}

const MedicationCard: React.FC<MedicationCardProps> = React.memo(({ viewModel, onDelete, onMarkTaken, onMarkPastTaken, onEdit, onMoveUp, onMoveDown, schedules, scheduleEditUrl }) => {
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
    <div className="bg-white rounded-2xl shadow-soft p-4 border border-pink-100">
      <div className="flex items-center justify-between">
        {(onMoveUp || onMoveDown) && (
          <div className="flex flex-col mr-2 -my-1">
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className={`p-0.5 rounded ${onMoveUp ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-200'}`}
              aria-label="上に移動"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className={`p-0.5 rounded ${onMoveDown ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-200'}`}
              aria-label="下に移動"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        )}
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
      {scheduleEditUrl && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {schedules && schedules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {schedules.map((s) => (
                <a
                  key={s.scheduleId}
                  href={scheduleEditUrl || '#'}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs hover:bg-primary-100 transition-colors"
                >
                  <Clock size={10} />
                  <span>{s.time}</span>
                  <span className="text-primary-500">{s.label}</span>
                </a>
              ))}
            </div>
          ) : (
            <a
              href={scheduleEditUrl || '#'}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs hover:bg-amber-100 transition-colors"
            >
              <AlertCircle size={12} />
              <span>スケジュール未設定 - タップして設定</span>
            </a>
          )}
        </div>
      )}
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
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-soft-lg">
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
