'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useMedications } from '@/presentation/hooks/useMedications';
import { MedicationList } from '@/components/medications/MedicationList';
import { MedicationForm, MedicationFormData } from '@/components/medications/MedicationForm';
import { ScheduleForm, ScheduleFormData } from '@/components/schedules/ScheduleForm';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { MemberIcon } from '@/components/shared/MemberIcon';
import { MemberEntity, Member } from '@/domain/entities/Member';
import { Medication, MedicationCategory } from '@/domain/entities/Medication';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { useMedicationRecordActions } from '@/presentation/hooks/useMedicationRecordActions';
import { useSchedules } from '@/presentation/hooks/useSchedules';
import { MedicationScheduleMap } from '@/components/medications/MedicationList';
import { DayOfWeek } from '@/domain/entities/Schedule';
import Link from 'next/link';
import { Plus, ClipboardList, Clock, X, Check } from 'lucide-react';

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日',
};
const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function getScheduleLabel(daysOfWeek: readonly DayOfWeek[], intervalDays?: number): string {
  if (intervalDays === -1) return '頓服';
  if (intervalDays && intervalDays > 0) return `${intervalDays}日毎`;
  if (daysOfWeek.length === 0 || daysOfWeek.length === 7) return '毎日';
  return DAY_ORDER.filter((d) => daysOfWeek.includes(d)).map((d) => DAY_LABELS[d]).join('・');
}

function MemberMedications({ member, userId, categoryFilter }: { member: Member; userId: string; categoryFilter: MedicationCategory | null }) {
  const { medications, isLoading, createMedication, updateMedication, deleteMedication, reorderMedications } = useMedications(member.id);
  const { markAsTaken, markAsTakenAt } = useMedicationRecordActions();
  const { schedules, createSchedule } = useSchedules();
  const entity = new MemberEntity(member);
  const displayInfo = entity.getDisplayInfo();
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addedMedName, setAddedMedName] = useState<string | null>(null);
  const [scheduleTargetName, setScheduleTargetName] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);

  const scheduleMap = useMemo<MedicationScheduleMap>(() => {
    const map: MedicationScheduleMap = {};
    const memberSchedules = schedules.filter((s) => s.schedule.memberId === member.id);
    for (const item of memberSchedules) {
      const medId = item.schedule.medicationId;
      if (!map[medId]) map[medId] = [];
      map[medId].push({
        scheduleId: item.schedule.id,
        time: item.schedule.scheduledTime,
        label: getScheduleLabel(item.schedule.daysOfWeek, item.schedule.intervalDays),
      });
    }
    return map;
  }, [schedules, member.id]);

  useEffect(() => {
    if (editingMed && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [editingMed]);

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showAddForm]);

  const filteredMedications = useMemo(
    () => categoryFilter ? medications.filter((m) => m.medication.category === categoryFilter) : medications,
    [medications, categoryFilter],
  );

  const handleMarkTaken = useCallback(async (medicationId: string) => {
    await markAsTaken(member.id, medicationId);
  }, [member.id, markAsTaken]);

  const handleMarkPastTaken = useCallback(async (medicationId: string, takenAt: string) => {
    await markAsTakenAt(member.id, medicationId, takenAt);
  }, [member.id, markAsTakenAt]);

  const handleEdit = (medication: Medication) => {
    setEditingMed(medication);
  };

  const handleUpdate = async (data: MedicationFormData) => {
    if (!editingMed) return;
    await updateMedication(editingMed.id, {
      name: data.name,
      dosage: data.dosage || undefined,
      frequency: data.frequency || undefined,
      stockQuantity: data.stockQuantity,
      stockAlertDate: data.stockAlertDate,
      instructions: data.instructions,
      status: data.status,
    });
    setEditingMed(null);
  };

  const handleCreate = async (data: MedicationFormData) => {
    await createMedication({
      memberId: member.id,
      userId,
      name: data.name,
      category: data.category,
      dosage: data.dosage,
      frequency: data.frequency,
      stockQuantity: data.stockQuantity,
      stockAlertDate: data.stockAlertDate,
      instructions: data.instructions,
    });
    setShowAddForm(false);
    setAddedMedName(data.name);
    setScheduleTargetName(data.name);
  };

  const scheduleTargetMed = useMemo(
    () => scheduleTargetName
      ? medications.find((m) => m.medication.name === scheduleTargetName) ?? null
      : null,
    [medications, scheduleTargetName],
  );

  const handleCreateSchedule = async (data: ScheduleFormData) => {
    if (!scheduleTargetMed) return;
    await createSchedule({
      medicationId: scheduleTargetMed.medication.id,
      userId,
      memberId: member.id,
      scheduledTime: data.scheduledTime,
      daysOfWeek: data.daysOfWeek,
      intervalDays: data.intervalDays,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      reminderMinutesBefore: data.reminderMinutesBefore,
    });
    setScheduleTargetName(null);
    setAddedMedName(null);
  };

  const handleCreateMultipleSchedules = async (items: ScheduleFormData[]) => {
    if (!scheduleTargetMed) return;
    for (const data of items) {
      await createSchedule({
        medicationId: scheduleTargetMed.medication.id,
        userId,
        memberId: member.id,
        scheduledTime: data.scheduledTime,
        daysOfWeek: data.daysOfWeek,
        intervalDays: data.intervalDays,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        reminderMinutesBefore: data.reminderMinutesBefore,
      });
    }
    setScheduleTargetName(null);
    setAddedMedName(null);
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MemberIcon
            memberType={displayInfo.memberType}
            petType={displayInfo.petType}
            size={20}
            className="text-gray-600"
          />
          <h2 className="font-semibold text-gray-800">{displayInfo.name}</h2>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/members/${member.id}/medications#schedules`}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <Clock size={14} />
            <span>時間</span>
          </Link>
          <button
            type="button"
            onClick={() => { setShowAddForm((v) => !v); setAddedMedName(null); setScheduleTargetName(null); }}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
            aria-label={showAddForm ? '閉じる' : '薬を追加'}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showAddForm ? 'キャンセル' : '追加'}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div ref={addFormRef} className="mb-4 bg-white rounded-lg shadow-md p-4 border border-primary-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">薬を追加</h3>
          <MedicationForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />
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
              onClick={() => { setAddedMedName(null); setScheduleTargetName(null); }}
              className="text-green-500 hover:text-green-700 shrink-0"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-green-700 mt-1 ml-6">飲む時間を設定しますか？</p>
          <div className="mt-3 ml-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Clock size={13} />
                {addedMedName} のスケジュール
              </span>
              <button
                type="button"
                onClick={() => { setAddedMedName(null); setScheduleTargetName(null); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                後で設定する
              </button>
            </div>
            <ScheduleForm
              onSubmit={handleCreateSchedule}
              onSubmitMultiple={handleCreateMultipleSchedules}
            />
          </div>
        </div>
      )}

      {editingMed && (
        <div ref={editFormRef} className="mb-3 bg-white rounded-lg shadow-md p-4 border border-primary-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">薬の編集</h3>
          <MedicationForm
            onSubmit={handleUpdate}
            initialData={editingMed}
            onCancel={() => setEditingMed(null)}
          />
        </div>
      )}

      <MedicationList
        medications={filteredMedications}
        isLoading={isLoading}
        onDelete={deleteMedication}
        onMarkTaken={handleMarkTaken}
        onMarkPastTaken={handleMarkPastTaken}
        onEdit={handleEdit}
        onReorder={!categoryFilter ? reorderMedications : undefined}
        scheduleMap={scheduleMap}
        scheduleEditUrl={`/members/${member.id}/medications#schedules`}
      />
    </section>
  );
}

export default function Medications() {
  const { userId } = useAuth();
  const { members, isLoading } = useMembers(userId);
  const [selectedCategory, setSelectedCategory] = useState<MedicationCategory | null>(null);

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-ink-800 tracking-wide">お薬</h1>
          <Link
            href="/history"
            className="flex items-center space-x-1 text-sm text-ink-600 hover:text-ink-800 transition-colors"
          >
            <ClipboardList size={16} />
            <span>履歴</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {!isLoading && members.length > 0 && (
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12">
            <p className="text-gray-500 text-lg mb-4">メンバーがまだ登録されていません</p>
            <Link
              href="/members"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              メンバーを追加する
            </Link>
          </div>
        ) : (
          members.map((member) => (
            <MemberMedications key={member.id} member={member} userId={userId} categoryFilter={selectedCategory} />
          ))
        )}
      </main>

      <BottomNavigation activePath="/medications" />
    </div>
  );
}
