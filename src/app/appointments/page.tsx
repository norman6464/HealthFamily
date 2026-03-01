'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { useHospitals } from '@/presentation/hooks/useHospitals';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentForm, AppointmentFormData } from '@/components/appointments/AppointmentForm';
import { Plus, X } from 'lucide-react';

export default function AppointmentsPage() {
  const { userId } = useAuth();
  const { members, isLoading: membersLoading } = useMembers(userId);
  const { appointments, isLoading, createAppointment, deleteAppointment } = useAppointments();
  const { hospitals } = useHospitals();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: AppointmentFormData) => {
    await createAppointment(data);
    setShowForm(false);
  };

  const handleDelete = async (appointmentId: string) => {
    await deleteAppointment(appointmentId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">通院管理</h1>
          <button
            onClick={() => setShowForm(!showForm)}
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

        <AppointmentList
          appointments={appointments}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </main>

      <BottomNavigation activePath="/appointments" />
    </div>
  );
}
