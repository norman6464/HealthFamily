'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/presentation/hooks/useMedications';
import { useScheduleManagement } from '@/presentation/hooks/useScheduleManagement';
import { MedicationList } from '@/components/medications/MedicationList';
import { MedicationForm, MedicationFormData } from '@/components/medications/MedicationForm';
import { ScheduleForm, ScheduleFormData } from '@/components/schedules/ScheduleForm';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { useState } from 'react';
import { ArrowLeft, Plus, X, Clock } from 'lucide-react';
import { MedicationViewModel } from '@/domain/usecases/ManageMedications';

export default function Medications() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;
  const { userId } = useAuth();
  const { medications, isLoading, createMedication, deleteMedication } = useMedications(memberId);
  const { createSchedule } = useScheduleManagement();
  const [showMedForm, setShowMedForm] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<MedicationViewModel | null>(null);

  const handleCreateMedication = async (data: MedicationFormData) => {
    await createMedication({
      memberId,
      userId,
      name: data.name,
      category: data.category,
      dosage: data.dosage,
      frequency: data.frequency,
      stockQuantity: data.stockQuantity,
      stockAlertDate: data.stockAlertDate,
      instructions: data.instructions,
    });
    setShowMedForm(false);
  };

  const handleCreateSchedule = async (data: ScheduleFormData) => {
    if (!scheduleTarget) return;
    await createSchedule({
      medicationId: scheduleTarget.medication.id,
      userId,
      memberId,
      scheduledTime: data.scheduledTime,
      daysOfWeek: data.daysOfWeek,
      reminderMinutesBefore: data.reminderMinutesBefore,
    });
    setScheduleTarget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/members')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="メンバー一覧に戻る"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-primary-600">薬管理</h1>
          </div>
          <button
            onClick={() => setShowMedForm(!showMedForm)}
            className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showMedForm ? '閉じる' : '薬を追加'}
          >
            {showMedForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {showMedForm && (
          <div className="mb-6">
            <MedicationForm onSubmit={handleCreateMedication} />
          </div>
        )}

        {scheduleTarget && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock size={18} className="text-primary-600" />
                <h2 className="font-semibold text-gray-800">
                  {scheduleTarget.medication.name} のスケジュール
                </h2>
              </div>
              <button
                onClick={() => setScheduleTarget(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="閉じる"
              >
                <X size={18} />
              </button>
            </div>
            <ScheduleForm onSubmit={handleCreateSchedule} />
          </div>
        )}

        <MedicationList
          medications={medications}
          isLoading={isLoading}
          onDelete={deleteMedication}
        />

        {medications.length > 0 && !scheduleTarget && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">スケジュール追加</h2>
            <div className="space-y-2">
              {medications.map((vm) => (
                <button
                  key={vm.medication.id}
                  onClick={() => setScheduleTarget(vm)}
                  className="w-full flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 transition-colors text-left"
                >
                  <span className="text-sm text-gray-700">{vm.medication.name}</span>
                  <Clock size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation activePath="/members" />
    </div>
  );
}
