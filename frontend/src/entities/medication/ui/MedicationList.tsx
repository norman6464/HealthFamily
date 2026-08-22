import React, { useEffect, useRef, useState } from "react";
import { Pill, Check, Pencil, Clock, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import type { Medication } from "@/shared/api";
import { ConfirmationDialog } from "@/shared/ui";
import { LoadingSpinner } from "@/shared/ui";
import { EmptyStatePrompt } from "@/shared/ui";
import { formatDateShort } from "@/shared/lib";

export interface MedicationViewModel {
  medication: Medication;
  isLowStock: boolean;
  displayInfo: { name: string; categoryLabel: string; dosageInfo: string };
}

export interface MedicationScheduleInfo {
  scheduleId: string;
  time: string;
  label: string; // "毎日", "月・水・金", "21日毎" etc.
  /** 停止中は「今日の予定」に出ない。出ていないのに時刻だけ見えると誤解する */
  isEnabled: boolean;
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
  onChangeStatus?: (medicationId: string, status: "active" | "paused") => Promise<void>;
  scheduleMap?: MedicationScheduleMap;
  scheduleEditUrl?: string;
}

// 休薬中・中止の薬は一覧から折りたたみセクションへ隔離する
const isHiddenStatus = (status: string) => status === "paused" || status === "discontinued";

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  isLoading,
  onDelete,
  onMarkTaken,
  onMarkPastTaken,
  onEdit,
  onReorder,
  onChangeStatus,
  scheduleMap,
  scheduleEditUrl,
}) => {
  // 並び替えの体感速度を上げるためにローカルで楽観的に更新する
  const [localOrder, setLocalOrder] = useState<MedicationViewModel[]>(medications);
  const [showHidden, setShowHidden] = useState(false);
  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const queuedOrderRef = useRef<string[] | null>(null);

  useEffect(() => {
    setLocalOrder(medications);
  }, [medications]);

  useEffect(
    () => () => {
      if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    },
    [],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (medications.length === 0) {
    return (
      <EmptyStatePrompt
        message="薬がまだ登録されていません"
        subMessage="上の「追加」から薬を追加してください"
      />
    );
  }

  const visibleList = localOrder.filter((vm) => !isHiddenStatus(vm.medication.status));
  const hiddenList = localOrder.filter((vm) => isHiddenStatus(vm.medication.status));

  const flushReorder = async () => {
    if (!onReorder || inFlightRef.current) return;
    const payload = queuedOrderRef.current;
    if (!payload) return;
    queuedOrderRef.current = null;
    inFlightRef.current = true;
    try {
      await onReorder(payload);
    } catch {
      queuedOrderRef.current = null;
      setLocalOrder(medications);
    } finally {
      inFlightRef.current = false;
      if (queuedOrderRef.current) void flushReorder();
    }
  };

  // index は visibleList 内の位置。非表示分は末尾に付けて全件の並びを送る
  const handleMove = (index: number, direction: "up" | "down") => {
    if (!onReorder) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visibleList.length) return;
    const newVisible = [...visibleList];
    [newVisible[index], newVisible[targetIndex]] = [newVisible[targetIndex], newVisible[index]];
    const newList = [...newVisible, ...hiddenList];
    setLocalOrder(newList);
    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(() => {
      queuedOrderRef.current = newList.map((vm) => vm.medication.id);
      void flushReorder();
    }, 400);
  };

  // 予定が1件も無い、または全部止まっている薬は「今日の予定」に出てこない。
  // カード単位のバッジだけだと、薬が多いほど見落とす。先頭でまとめて知らせる
  const unscheduled = visibleList.filter((vm) => {
    const list = scheduleMap?.[vm.medication.id];
    return !list || list.length === 0 || list.every((s) => !s.isEnabled);
  });

  return (
    <div className="space-y-3">
      {unscheduled.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">{unscheduled.length}件</span>
            の薬は今日の予定に出ません（
            {unscheduled.map((vm) => vm.medication.name).join("、")}）。
            時刻の設定か、停止中の解除が必要です。
          </p>
        </div>
      )}
      {visibleList.map((vm, index) => (
        <MedicationCard
          key={vm.medication.id}
          viewModel={vm}
          onDelete={onDelete}
          onMarkTaken={onMarkTaken}
          onMarkPastTaken={onMarkPastTaken}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
          onMoveUp={onReorder && index > 0 ? () => handleMove(index, "up") : undefined}
          onMoveDown={onReorder && index < visibleList.length - 1 ? () => handleMove(index, "down") : undefined}
          schedules={scheduleMap?.[vm.medication.id]}
          scheduleEditUrl={scheduleEditUrl}
        />
      ))}

      {visibleList.length === 0 && hiddenList.length > 0 && (
        <p className="text-sm text-ink-500 text-center py-2">服用中の薬はありません</p>
      )}

      {hiddenList.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            aria-expanded={showHidden}
            className="flex items-center space-x-1 text-sm text-ink-500 hover:text-ink-700 transition-colors"
          >
            {showHidden ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>休薬中・中止の薬 ({hiddenList.length}件)</span>
          </button>
          {showHidden && (
            <div className="mt-2 space-y-3">
              {hiddenList.map((vm) => (
                <MedicationCard
                  key={vm.medication.id}
                  viewModel={vm}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onChangeStatus={onChangeStatus}
                  schedules={scheduleMap?.[vm.medication.id]}
                  scheduleEditUrl={scheduleEditUrl}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface MedicationCardProps {
  viewModel: MedicationViewModel;
  onDelete: (medicationId: string) => void;
  onMarkTaken?: (medicationId: string) => Promise<void>;
  onMarkPastTaken?: (medicationId: string, takenAt: string) => Promise<void>;
  onEdit?: (medication: Medication) => void;
  onChangeStatus?: (medicationId: string, status: "active" | "paused") => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  schedules?: MedicationScheduleInfo[];
  scheduleEditUrl?: string;
}

const MedicationCard: React.FC<MedicationCardProps> = React.memo(
  ({
    viewModel,
    onDelete,
    onMarkTaken,
    onMarkPastTaken,
    onEdit,
    onChangeStatus,
    onMoveUp,
    onMoveDown,
    schedules,
    scheduleEditUrl,
  }) => {
    const { medication, isLowStock, displayInfo } = viewModel;
    const [isTaken, setIsTaken] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
    const isPaused = medication.status === "paused";
    const isDiscontinued = medication.status === "discontinued";

    const handleChangeStatus = async (status: "active" | "paused") => {
      if (!onChangeStatus || isStatusSubmitting) return;
      setIsStatusSubmitting(true);
      try {
        await onChangeStatus(medication.id, status);
      } finally {
        setIsStatusSubmitting(false);
      }
    };
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPastRecordOpen, setIsPastRecordOpen] = useState(false);
    const [pastDate, setPastDate] = useState("");
    const [pastTime, setPastTime] = useState("12:00");
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
          setPastDate("");
          setPastTime("12:00");
        }, 1500);
      } finally {
        setIsPastSubmitting(false);
      }
    };

    const isDimmed = isPaused || isDiscontinued;

    return (
      <div
        className={`bg-white rounded-lg shadow-md p-4 border border-primary-100${
          isDimmed ? " opacity-60" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          {(onMoveUp || onMoveDown) && (
            <div className="flex flex-col mr-2 -my-1">
              <button
                onClick={onMoveUp}
                disabled={!onMoveUp}
                className={`p-0.5 rounded ${
                  onMoveUp ? "text-ink-500 hover:text-ink-700 hover:bg-primary-50" : "text-primary-100"
                }`}
                aria-label="上に移動"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={onMoveDown}
                disabled={!onMoveDown}
                className={`p-0.5 rounded ${
                  onMoveDown ? "text-ink-500 hover:text-ink-700 hover:bg-primary-50" : "text-primary-100"
                }`}
                aria-label="下に移動"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <Pill size={20} className="text-primary-600" />
              <p className="font-semibold text-ink-800">{displayInfo.name}</p>
              {isPaused && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-bold border border-amber-300">
                  休薬中
                </span>
              )}
              {isDiscontinued && (
                <span className="px-2 py-0.5 bg-ink-100 text-ink-600 text-xs rounded-full font-bold border border-ink-200">
                  中止
                </span>
              )}
              {isLowStock && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                  在庫少
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-ink-500 space-y-0.5">
              <p>{displayInfo.categoryLabel}</p>
              {displayInfo.dosageInfo && <p>{displayInfo.dosageInfo}</p>}
              {medication.stockQuantity !== null && medication.stockQuantity !== undefined && (
                <p>在庫: {medication.stockQuantity}日分</p>
              )}
              {medication.stockAlertDate && (
                <p>警告日: {formatDateShort(medication.stockAlertDate)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(medication)}
                className="text-ink-500 hover:text-ink-700 text-sm px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
                aria-label="編集"
              >
                <Pencil size={14} />
              </button>
            )}
            {onMarkPastTaken && (
              <button
                onClick={() => setIsPastRecordOpen(true)}
                className="text-ink-500 hover:text-ink-700 text-sm px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
                aria-label="過去の記録"
              >
                <Clock size={14} />
              </button>
            )}
            {onMarkTaken &&
              (isTaken ? (
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
                  {isSubmitting ? "記録中..." : "飲んだ"}
                </button>
              ))}
            {onChangeStatus && !isDiscontinued && (
              <button
                onClick={() => handleChangeStatus(isPaused ? "active" : "paused")}
                disabled={isStatusSubmitting}
                className={`text-sm px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
                  isPaused
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
                aria-label={isPaused ? "再開する" : "休薬する"}
              >
                {isStatusSubmitting ? "変更中..." : isPaused ? "再開する" : "休薬する"}
              </button>
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
        <div className="mt-2 pt-2 border-t border-primary-100">
          {schedules && schedules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {schedules.map((s) => {
                const chipClass = s.isEnabled
                  ? "inline-flex items-center space-x-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs"
                  : "inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs";
                const content = (
                  <>
                    <Clock size={10} />
                    <span>{s.time}</span>
                    <span className={s.isEnabled ? "text-primary-500" : "text-amber-600"}>
                      {s.label}
                    </span>
                    {!s.isEnabled && <span className="font-medium">停止中</span>}
                  </>
                );
                return scheduleEditUrl ? (
                  <a
                    key={s.scheduleId}
                    href={scheduleEditUrl}
                    className={`${chipClass} hover:bg-primary-100 transition-colors`}
                  >
                    {content}
                  </a>
                ) : (
                  <span key={s.scheduleId} className={chipClass}>
                    {content}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
              <AlertCircle size={12} />
              <span>スケジュール未設定</span>
            </span>
          )}
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
              <h2 className="mb-2 text-lg font-bold text-ink-800">過去の服薬記録</h2>
              <p className="mb-4 text-sm text-ink-600">「{displayInfo.name}」の飲み忘れを記録します</p>
              {pastRecordSuccess ? (
                <div className="flex items-center justify-center py-4 text-green-600">
                  <Check size={20} className="mr-2" />
                  <span className="font-medium">記録しました</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">日付</label>
                      <input
                        type="date"
                        value={pastDate}
                        onChange={(e) => setPastDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-md border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">時刻</label>
                      <input
                        type="time"
                        value={pastTime}
                        onChange={(e) => setPastTime(e.target.value)}
                        className="w-full rounded-md border border-primary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPastRecordOpen(false);
                        setPastDate("");
                        setPastTime("12:00");
                      }}
                      className="rounded-md border border-primary-200 px-4 py-2 text-sm text-ink-700 hover:bg-primary-50"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handlePastRecordSubmit}
                      disabled={!pastDate || isPastSubmitting}
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isPastSubmitting ? "記録中..." : "記録する"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

MedicationCard.displayName = "MedicationCard";
