import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, X, Check } from "lucide-react";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import type { Medication, Member, Schedule } from "@/shared/api";
import { MemberIcon, type MemberType, type PetType } from "@/shared/ui";
import { useUpdateMedicationStatus } from "@/entities/medication";
import {
  MedicationList,
  type MedicationViewModel,
  type MedicationScheduleMap,
} from "./MedicationList";
import {
  MedicationForm,
  type MedicationFormData,
} from "./MedicationForm";
import {
  ScheduleForm,
  type ScheduleFormData,
  type DayOfWeek,
} from "./ScheduleForm";
import {
  getMedicationCategoryLabel,
  type MedicationCategory,
} from "@/shared/config";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};
const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function getScheduleLabel(daysOfWeek: readonly string[], intervalDays?: number | null): string {
  if (intervalDays === -1) return "頓服";
  if (intervalDays && intervalDays > 0) return `${intervalDays}日毎`;
  if (daysOfWeek.length === 0 || daysOfWeek.length === 7) return "毎日";
  return DAY_ORDER.filter((d) => daysOfWeek.includes(d))
    .map((d) => DAY_LABELS[d])
    .join("・");
}

/** 在庫が残り日数より少ないかどうかを判定する（旧 MedicationEntity.isLowStock 相当） */
function computeIsLowStock(medication: Medication): boolean {
  if (
    medication.stockQuantity === null ||
    medication.stockQuantity === undefined ||
    !medication.stockAlertDate
  ) {
    return false;
  }
  const today = new Date();
  const alertDate = new Date(medication.stockAlertDate);
  const daysUntilAlert = Math.ceil(
    (alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntilAlert <= 0) return false;
  return medication.stockQuantity < daysUntilAlert;
}

function toViewModel(medication: Medication): MedicationViewModel {
  const dosageInfo = [medication.dosageAmount, medication.frequency].filter(Boolean).join(" / ");
  return {
    medication,
    isLowStock: computeIsLowStock(medication),
    displayInfo: {
      name: medication.name,
      categoryLabel: getMedicationCategoryLabel(medication.category),
      dosageInfo,
    },
  };
}

interface MemberMedicationsProps {
  member: Member;
  categoryFilter: MedicationCategory | null;
}

export function MemberMedications({ member, categoryFilter }: MemberMedicationsProps) {
  const qc = useQueryClient();
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addedMedName, setAddedMedName] = useState<string | null>(null);
  const [scheduleTargetName, setScheduleTargetName] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);

  const { data: medications = [], isLoading } = useQuery({
    queryKey: queryKeys.medications.byMember(member.id),
    queryFn: () => api.get<Medication[]>(`/members/${member.id}/medications`),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: () => api.get<Schedule[]>("/schedules"),
  });

  const invalidateMeds = () =>
    qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(member.id) });
  const invalidateSchedules = () =>
    qc.invalidateQueries({ queryKey: queryKeys.schedules.all });

  const createMedication = useMutation({
    mutationFn: (data: MedicationFormData) =>
      api.post<Medication>("/medications", {
        memberId: member.id,
        name: data.name,
        category: data.category,
        dosageAmount: data.dosage || undefined,
        frequency: data.frequency || undefined,
        stockQuantity: data.stockQuantity,
        stockAlertDate: data.stockAlertDate,
        instructions: data.instructions,
      }),
    onSuccess: (_created, data) => {
      invalidateMeds();
      setShowAddForm(false);
      setAddedMedName(data.name);
      setScheduleTargetName(data.name);
    },
  });

  const updateMedication = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MedicationFormData }) =>
      api.patch<Medication>(`/medications/${id}`, {
        name: data.name,
        dosageAmount: data.dosage || null,
        frequency: data.frequency || null,
        stockQuantity: data.stockQuantity ?? null,
        stockAlertDate: data.stockAlertDate ?? null,
        instructions: data.instructions ?? null,
        status: data.status,
      }),
    onSuccess: () => {
      invalidateMeds();
      setEditingMed(null);
    },
  });

  const deleteMedication = useMutation({
    mutationFn: (id: string) => api.delete(`/medications/${id}`),
    onSuccess: invalidateMeds,
  });

  const changeStatus = useUpdateMedicationStatus();

  const reorderMedications = useMutation({
    mutationFn: (orderedIds: string[]) => api.post("/medications/reorder", { orderedIds }),
    onSuccess: invalidateMeds,
  });

  const createRecord = useMutation({
    mutationFn: ({ medicationId, takenAt }: { medicationId: string; takenAt?: string }) =>
      api.post("/records", {
        memberId: member.id,
        medicationId,
        ...(takenAt ? { takenAt } : {}),
      }),
  });

  const createSchedule = useMutation({
    mutationFn: ({ medicationId, data }: { medicationId: string; data: ScheduleFormData }) =>
      api.post<Schedule>("/schedules", {
        medicationId,
        memberId: member.id,
        scheduledTime: data.scheduledTime,
        daysOfWeek: data.daysOfWeek,
        intervalDays: data.intervalDays,
        startDate: data.startDate,
        isEnabled: true,
        reminderMinutesBefore: data.reminderMinutesBefore,
      }),
    onSuccess: invalidateSchedules,
  });

  const scheduleMap = useMemo<MedicationScheduleMap>(() => {
    const map: MedicationScheduleMap = {};
    const memberSchedules = schedules.filter((s) => s.memberId === member.id);
    for (const s of memberSchedules) {
      if (!map[s.medicationId]) map[s.medicationId] = [];
      map[s.medicationId].push({
        scheduleId: s.id,
        time: s.scheduledTime,
        label: getScheduleLabel(s.daysOfWeek, s.intervalDays),
      });
    }
    return map;
  }, [schedules, member.id]);

  const viewModels = useMemo<MedicationViewModel[]>(
    () => medications.map(toViewModel),
    [medications],
  );

  const filteredMedications = useMemo(
    () =>
      categoryFilter
        ? viewModels.filter((vm) => vm.medication.category === categoryFilter)
        : viewModels,
    [viewModels, categoryFilter],
  );

  const scheduleTargetMed = useMemo(
    () =>
      scheduleTargetName
        ? medications.find((m) => m.name === scheduleTargetName) ?? null
        : null,
    [medications, scheduleTargetName],
  );

  useEffect(() => {
    if (editingMed && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editingMed]);

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [showAddForm]);

  const handleMarkTaken = async (medicationId: string) => {
    await createRecord.mutateAsync({ medicationId });
  };

  const handleMarkPastTaken = async (medicationId: string, takenAt: string) => {
    await createRecord.mutateAsync({ medicationId, takenAt });
  };

  const handleCreateSchedule = async (data: ScheduleFormData) => {
    if (!scheduleTargetMed) return;
    await createSchedule.mutateAsync({ medicationId: scheduleTargetMed.id, data });
    setScheduleTargetName(null);
    setAddedMedName(null);
  };

  const handleCreateMultipleSchedules = async (items: ScheduleFormData[]) => {
    if (!scheduleTargetMed) return;
    for (const data of items) {
      await createSchedule.mutateAsync({ medicationId: scheduleTargetMed.id, data });
    }
    setScheduleTargetName(null);
    setAddedMedName(null);
  };

  const displayInfo = {
    memberType: member.memberType as MemberType,
    petType: (member.petType ?? undefined) as PetType | undefined,
    name: member.name,
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MemberIcon
            memberType={displayInfo.memberType}
            petType={displayInfo.petType}
            size={20}
            className="text-ink-600"
          />
          <h2 className="font-semibold text-ink-800">{displayInfo.name}</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddedMedName(null);
              setScheduleTargetName(null);
            }}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
            aria-label={showAddForm ? "閉じる" : "薬を追加"}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showAddForm ? "キャンセル" : "追加"}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div
          ref={addFormRef}
          className="mb-4 bg-white rounded-lg shadow-md p-4 border border-primary-200"
        >
          <h3 className="text-sm font-semibold text-ink-700 mb-3">薬を追加</h3>
          <MedicationForm
            onSubmit={(data) => createMedication.mutate(data)}
            onCancel={() => setShowAddForm(false)}
          />
          {createMedication.isError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              追加できませんでした: {createMedication.error.message}
            </p>
          )}
        </div>
      )}

      {addedMedName && scheduleTargetMed && (
        <div className="mb-4 bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Check size={16} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium truncate">
                「{addedMedName}」を追加しました
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddedMedName(null);
                setScheduleTargetName(null);
              }}
              className="text-green-500 hover:text-green-700 shrink-0"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-green-700 mt-1 ml-6">飲む時間を設定しますか？</p>
          <div className="mt-3 ml-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-ink-600 flex items-center gap-1">
                <Clock size={13} />
                {addedMedName} のスケジュール
              </span>
              <button
                type="button"
                onClick={() => {
                  setAddedMedName(null);
                  setScheduleTargetName(null);
                }}
                className="text-xs text-ink-400 hover:text-ink-600"
              >
                後で設定する
              </button>
            </div>
            <ScheduleForm onSubmit={handleCreateSchedule} onSubmitMultiple={handleCreateMultipleSchedules} />
          </div>
        </div>
      )}

      {editingMed && (
        <div
          ref={editFormRef}
          className="mb-3 bg-white rounded-lg shadow-md p-4 border border-primary-200"
        >
          <h3 className="text-sm font-semibold text-ink-700 mb-3">薬の編集</h3>
          <MedicationForm
            onSubmit={(data) => updateMedication.mutate({ id: editingMed.id, data })}
            initialData={editingMed}
            onCancel={() => setEditingMed(null)}
          />
          {updateMedication.isError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              更新できませんでした: {updateMedication.error.message}
            </p>
          )}
        </div>
      )}

      <MedicationList
        medications={filteredMedications}
        isLoading={isLoading}
        onDelete={(id) => deleteMedication.mutate(id)}
        onMarkTaken={handleMarkTaken}
        onMarkPastTaken={handleMarkPastTaken}
        onEdit={(medication) => setEditingMed(medication)}
        onChangeStatus={async (id, status) => {
          await changeStatus.mutateAsync({ medicationId: id, status });
        }}
        onReorder={
          !categoryFilter
            ? async (ids) => {
                await reorderMedications.mutateAsync(ids);
              }
            : undefined
        }
        scheduleMap={scheduleMap}
      />
    </section>
  );
}
