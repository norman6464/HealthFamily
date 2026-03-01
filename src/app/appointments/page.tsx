'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { useHospitals } from '@/presentation/hooks/useHospitals';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentForm, AppointmentFormData } from '@/components/appointments/AppointmentForm';
import { Appointment } from '@/domain/entities/Appointment';
import Link from 'next/link';
import { Plus, X, MapPin } from 'lucide-react';

export default function AppointmentsPage() {
  const { userId } = useAuth();
  const { members, isLoading: membersLoading } = useMembers(userId);
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { hospitals } = useHospitals();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const handleCreate = async (data: AppointmentFormData) => {
    await createAppointment(data);
    setShowForm(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(false);
  };

  const handleUpdate = async (data: AppointmentFormData) => {
    if (!editingAppointment) return;
    await updateAppointment(editingAppointment.id, {
      appointmentDate: data.appointmentDate,
      type: data.type,
      notes: data.notes,
    });
    setEditingAppointment(null);
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  const handleDelete = async (appointmentId: string) => {
    await deleteAppointment(appointmentId);
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
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-blue-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">通院予約の編集</h2>
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

        <AppointmentList
          appointments={appointments}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div className="mt-6">
          <Link
            href="/hospitals"
            className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MapPin size={18} className="text-primary-600" />
              <span className="text-sm font-medium text-gray-700">病院管理</span>
            </div>
            <span className="text-xs text-gray-400">{hospitals.length}件</span>
          </Link>
        </div>
      </main>

      <BottomNavigation activePath="/appointments" />
    </div>
  );
}
