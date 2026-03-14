'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { useHospitals } from '@/presentation/hooks/useHospitals';
import { useVaccinations } from '@/presentation/hooks/useVaccinations';
import { useExaminations } from '@/presentation/hooks/useExaminations';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { AppointmentList, AppointmentFilter, getAppointmentCounts } from '@/components/appointments/AppointmentList';
import { AppointmentForm, AppointmentFormData } from '@/components/appointments/AppointmentForm';
import { VaccinationForm, VaccinationFormData } from '@/components/vaccinations/VaccinationForm';
import { VaccinationList } from '@/components/vaccinations/VaccinationList';
import { ExaminationForm, ExaminationFormData } from '@/components/examinations/ExaminationForm';
import { ExaminationList } from '@/components/examinations/ExaminationList';
import { TabSwitch } from '@/components/shared/TabSwitch';
import { Appointment } from '@/domain/entities/Appointment';
import { MiniCalendar } from '@/components/appointments/MiniCalendar';
import Link from 'next/link';
import { Plus, X, MapPin, Syringe, ClipboardList } from 'lucide-react';

export default function AppointmentsPage() {
  const { userId } = useAuth();
  const { members, isLoading: membersLoading } = useMembers(userId);
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { hospitals } = useHospitals();
  const { vaccinations, isLoading: vaccinationsLoading, createVaccination, updateVaccination, deleteVaccination } = useVaccinations();
  const { examinations, isLoading: examinationsLoading, createExamination, updateExamination, deleteExamination } = useExaminations();
  const [showForm, setShowForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showExaminationForm, setShowExaminationForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentFilter>('upcoming');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const appointmentDates = useMemo(() => appointments.map((a) => new Date(a.appointmentDate)), [appointments]);
  const counts = useMemo(() => getAppointmentCounts(appointments), [appointments]);
  const tabs = useMemo(() => [
    { id: 'upcoming', label: '今後の予定', count: counts.upcoming },
    { id: 'past', label: '過去の予定', count: counts.past },
  ], [counts]);

  const handleCreate = async (data: AppointmentFormData) => {
    await createAppointment(data);
    setShowForm(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(false);
    setUpdateError(null);
  };

  useEffect(() => {
    if (editingAppointment && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingAppointment]);

  const handleUpdate = async (data: AppointmentFormData) => {
    if (!editingAppointment) return;
    setUpdateError(null);
    try {
      await updateAppointment(editingAppointment.id, {
        appointmentDate: data.appointmentDate,
        type: data.type,
        notes: data.notes,
      });
      setEditingAppointment(null);
    } catch {
      setUpdateError('更新に失敗しました。もう一度お試しください。');
    }
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  const handleDelete = async (appointmentId: string) => {
    if (!window.confirm('この予約を削除しますか？')) return;
    await deleteAppointment(appointmentId);
  };

  const handleCreateVaccination = async (data: VaccinationFormData) => {
    await createVaccination(data);
    setShowVaccinationForm(false);
  };

  const handleDeleteVaccination = async (id: string) => {
    if (!window.confirm('このワクチン記録を削除しますか？')) return;
    await deleteVaccination(id);
  };

  const handleCreateExamination = async (data: ExaminationFormData) => {
    await createExamination(data);
    setShowExaminationForm(false);
  };

  const handleDeleteExamination = async (id: string) => {
    if (!window.confirm('この検査記録を削除しますか？')) return;
    await deleteExamination(id);
  };

  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      setEditingAppointment(null);
      setShowForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">通院管理</h1>
          <button
            onClick={handleToggleForm}
            className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showForm ? '閉じる' : '予約を追加'}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {showForm && !membersLoading && members.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">通院予約の追加</h2>
            <AppointmentForm
              members={members}
              hospitals={hospitals}
              onSubmit={handleCreate}
            />
          </div>
        )}

        {showForm && !membersLoading && members.length === 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            先にメンバーを登録してください。
          </div>
        )}

        {editingAppointment && !membersLoading && members.length > 0 && (
          <div ref={editFormRef} className="mb-6 bg-white rounded-lg shadow-md p-4 border border-blue-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">通院予約の編集</h2>
            {updateError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{updateError}</p>
            )}
            <AppointmentForm
              key={editingAppointment.id}
              members={members}
              hospitals={hospitals}
              onSubmit={handleUpdate}
              initialData={editingAppointment}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        <MiniCalendar appointmentDates={appointmentDates} />

        <TabSwitch tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as AppointmentFilter)} />

        <AppointmentList
          appointments={appointments}
          isLoading={isLoading}
          filter={activeTab}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Syringe size={18} className="text-primary-600" />
              <h2 className="text-base font-bold text-gray-800">ワクチンスケジュール</h2>
            </div>
            <button
              onClick={() => setShowVaccinationForm(!showVaccinationForm)}
              className="bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
              aria-label={showVaccinationForm ? '閉じる' : 'ワクチン記録を追加'}
            >
              {showVaccinationForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showVaccinationForm && !membersLoading && members.length > 0 && (
            <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">ワクチン記録の追加</h3>
              <VaccinationForm
                members={members}
                onSubmit={handleCreateVaccination}
                onCancel={() => setShowVaccinationForm(false)}
              />
            </div>
          )}

          {showVaccinationForm && !membersLoading && members.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
              先にメンバーを登録してください。
            </div>
          )}

          <VaccinationList
            vaccinations={vaccinations}
            isLoading={vaccinationsLoading}
            onUpdate={updateVaccination}
            onDelete={handleDeleteVaccination}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ClipboardList size={18} className="text-primary-600" />
              <h2 className="text-base font-bold text-gray-800">検査スケジュール</h2>
            </div>
            <button
              onClick={() => setShowExaminationForm(!showExaminationForm)}
              className="bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
              aria-label={showExaminationForm ? '閉じる' : '検査記録を追加'}
            >
              {showExaminationForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showExaminationForm && !membersLoading && members.length > 0 && (
            <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">検査記録の追加</h3>
              <ExaminationForm
                members={members}
                onSubmit={handleCreateExamination}
                onCancel={() => setShowExaminationForm(false)}
              />
            </div>
          )}

          {showExaminationForm && !membersLoading && members.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
              先にメンバーを登録してください。
            </div>
          )}

          <ExaminationList
            examinations={examinations}
            isLoading={examinationsLoading}
            onUpdate={updateExamination}
            onDelete={handleDeleteExamination}
          />
        </div>

        <div className="mt-6">
          <Link
            href="/hospitals"
            className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MapPin size={18} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-700">かかりつけ医(病院)</span>
            </div>
            <span className="text-xs text-gray-400">{hospitals.length}件</span>
          </Link>
        </div>
      </main>

      <BottomNavigation activePath="/appointments" />
    </div>
  );
}
