import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Clock, X, Check } from "lucide-react";
import type { Medication, Member } from "@/shared/api";
import { MemberIcon, type MemberType, type PetType } from "@/shared/ui";
import { getMedicationCategoryLabel, type MedicationCategory } from "@/shared/config";
import {
  isLowStock,
  useMemberMedications,
  useUpdateMedicationStatus,
  MedicationList,
  type MedicationViewModel,
  type MedicationScheduleMap,
} from "@/entities/medication";
import { getScheduleLabel, useSchedules } from "@/entities/schedule";
import { AddMedicationForm } from "@/features/create-medication";
import { EditMedicationForm } from "@/features/edit-medication";
import { useDeleteMedication } from "@/features/delete-medication";
import { useReorderMedications } from "@/features/reorder-medications";
import { useMarkMedicationTaken } from "@/features/take-medication";
import { ScheduleForm, useCreateSchedule, type ScheduleFormData } from "@/features/create-schedule";

function toViewModel(medication: Medication): MedicationViewModel {
  const dosageInfo = [medication.dosageAmount, medication.frequency].filter(Boolean).join(" / ");
  return {
    medication,
    isLowStock: isLowStock(medication),
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
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addedMedName, setAddedMedName] = useState<string | null>(null);
  const [scheduleTargetName, setScheduleTargetName] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);

  const { data: medications = [], isLoading } = useMemberMedications(member.id);
  const { data: schedules = [] } = useSchedules();

  const deleteMedication = useDeleteMedication(member.id);
  const changeStatus = useUpdateMedicationStatus();
  const reorderMedications = useReorderMedications(member.id);
  const markTaken = useMarkMedicationTaken(member.id);
  const createSchedule = useCreateSchedule(member.id);

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
    await markTaken.mutateAsync({ medicationId });
  };

  const handleMarkPastTaken = async (medicationId: string, takenAt: string) => {
    await markTaken.mutateAsync({ medicationId, takenAt });
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
          <AddMedicationForm
            memberId={member.id}
            onCreated={(name) => {
              setShowAddForm(false);
              setAddedMedName(name);
              setScheduleTargetName(name);
            }}
            onCancel={() => setShowAddForm(false)}
          />
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
          <EditMedicationForm
            memberId={member.id}
            medication={editingMed}
            onUpdated={() => setEditingMed(null)}
            onCancel={() => setEditingMed(null)}
          />
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
