'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { useHospitals } from '@/presentation/hooks/useHospitals';
import { useVaccinations } from '@/presentation/hooks/useVaccinations';
import { useExaminations } from '@/presentation/hooks/useExaminations';
import { useInsurances } from '@/presentation/hooks/useInsurances';
import { useAllergies } from '@/presentation/hooks/useAllergies';
import { usePrescriptions } from '@/presentation/hooks/usePrescriptions';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { AppointmentList, AppointmentFilter, getAppointmentCounts } from '@/components/appointments/AppointmentList';
import { AppointmentForm, AppointmentFormData } from '@/components/appointments/AppointmentForm';
import { VaccinationForm, VaccinationFormData } from '@/components/vaccinations/VaccinationForm';
import { VaccinationList } from '@/components/vaccinations/VaccinationList';
import { ExaminationForm, ExaminationFormData } from '@/components/examinations/ExaminationForm';
import { ExaminationList } from '@/components/examinations/ExaminationList';
import { InsuranceForm, InsuranceFormData } from '@/components/insurances/InsuranceForm';
import { InsuranceList } from '@/components/insurances/InsuranceList';
import { AllergyForm, AllergyFormData } from '@/components/allergies/AllergyForm';
import { AllergyList } from '@/components/allergies/AllergyList';
import { PrescriptionForm, PrescriptionFormData } from '@/components/prescriptions/PrescriptionForm';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
import { SectionWithForm } from '@/components/shared/SectionWithForm';
import { TabSwitch } from '@/components/shared/TabSwitch';
import { Appointment } from '@/domain/entities/Appointment';
import { MiniCalendar } from '@/components/appointments/MiniCalendar';
import Link from 'next/link';
import { Plus, X, MapPin, Syringe, ClipboardList, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';

export default function AppointmentsPage() {
  const { userId, isLoading: authLoading } = useAuth();
  const { members, isLoading: membersLoading } = useMembers(userId);
  const membersReady = !authLoading && !membersLoading;
  const hasNoMembers = membersReady && members.length === 0;
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { hospitals } = useHospitals();
  const { vaccinations, isLoading: vaccinationsLoading, createVaccination, updateVaccination, deleteVaccination } = useVaccinations();
  const { examinations, isLoading: examinationsLoading, createExamination, updateExamination, deleteExamination } = useExaminations();
  const { insurances, isLoading: insurancesLoading, createInsurance, updateInsurance, deleteInsurance } = useInsurances();
  const { allergies, isLoading: allergiesLoading, createAllergy, updateAllergy, deleteAllergy } = useAllergies();
  const { prescriptions, isLoading: prescriptionsLoading, createPrescription, updatePrescription, deletePrescription } = usePrescriptions();
  const [showForm, setShowForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showExaminationForm, setShowExaminationForm] = useState(false);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
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
        hospitalId: data.hospitalId,
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

  const handleCreateAllergy = async (data: AllergyFormData) => {
    await createAllergy(data);
    setShowAllergyForm(false);
  };

  const handleDeleteAllergy = async (id: string) => {
    if (!window.confirm('このアレルギー情報を削除しますか？')) return;
    await deleteAllergy(id);
  };

  const handleCreatePrescription = async (data: PrescriptionFormData) => {
    await createPrescription(data);
    setShowPrescriptionForm(false);
  };

  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm('この処方箋を削除しますか？')) return;
    await deletePrescription(id);
  };

  const handleCreateInsurance = async (data: InsuranceFormData) => {
    await createInsurance(data);
    setShowInsuranceForm(false);
  };

  const handleDeleteInsurance = async (id: string) => {
    if (!window.confirm('この保険を削除しますか？')) return;
    await deleteInsurance(id);
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
        {showForm && membersReady && members.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">通院予約の追加</h2>
            <AppointmentForm
              members={members}
              hospitals={hospitals}
              onSubmit={handleCreate}
            />
          </div>
        )}

        {showForm && hasNoMembers && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            先に<Link href="/members" className="underline font-medium text-yellow-800 hover:text-yellow-900">メンバーページ</Link>でメンバーを登録してください。
          </div>
        )}

        {editingAppointment && membersReady && members.length > 0 && (
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

        <SectionWithForm
          title="ワクチンスケジュール"
          icon={Syringe}
          showForm={showVaccinationForm}
          onToggleForm={() => setShowVaccinationForm(!showVaccinationForm)}
          membersReady={membersReady}
          hasNoMembers={hasNoMembers}
          addLabel="ワクチン記録を追加"
          formTitle="ワクチン記録の追加"
          formContent={
            <VaccinationForm
              members={members}
              onSubmit={handleCreateVaccination}
              onCancel={() => setShowVaccinationForm(false)}
            />
          }
        >
          <VaccinationList
            vaccinations={vaccinations}
            isLoading={vaccinationsLoading}
            onUpdate={updateVaccination}
            onDelete={handleDeleteVaccination}
          />
        </SectionWithForm>

        <SectionWithForm
          title="検査スケジュール"
          icon={ClipboardList}
          showForm={showExaminationForm}
          onToggleForm={() => setShowExaminationForm(!showExaminationForm)}
          membersReady={membersReady}
          hasNoMembers={hasNoMembers}
          addLabel="検査記録を追加"
          formTitle="検査記録の追加"
          formContent={
            <ExaminationForm
              members={members}
              onSubmit={handleCreateExamination}
              onCancel={() => setShowExaminationForm(false)}
            />
          }
        >
          <ExaminationList
            examinations={examinations}
            isLoading={examinationsLoading}
            onUpdate={updateExamination}
            onDelete={handleDeleteExamination}
          />
        </SectionWithForm>

        <SectionWithForm
          title="アレルギー管理"
          icon={AlertTriangle}
          showForm={showAllergyForm}
          onToggleForm={() => setShowAllergyForm(!showAllergyForm)}
          membersReady={membersReady}
          hasNoMembers={hasNoMembers}
          addLabel="アレルギーを追加"
          formTitle="アレルギーの追加"
          formContent={
            <AllergyForm
              members={members}
              onSubmit={handleCreateAllergy}
              onCancel={() => setShowAllergyForm(false)}
            />
          }
        >
          <AllergyList
            allergies={allergies}
            isLoading={allergiesLoading}
            onUpdate={updateAllergy}
            onDelete={handleDeleteAllergy}
          />
        </SectionWithForm>

        <SectionWithForm
          title="処方箋管理"
          icon={FileText}
          showForm={showPrescriptionForm}
          onToggleForm={() => setShowPrescriptionForm(!showPrescriptionForm)}
          membersReady={membersReady}
          hasNoMembers={hasNoMembers}
          addLabel="処方箋を追加"
          formTitle="処方箋の追加"
          formContent={
            <PrescriptionForm
              members={members}
              onSubmit={handleCreatePrescription}
              onCancel={() => setShowPrescriptionForm(false)}
            />
          }
        >
          <PrescriptionList
            prescriptions={prescriptions}
            isLoading={prescriptionsLoading}
            onUpdate={updatePrescription}
            onDelete={handleDeletePrescription}
          />
        </SectionWithForm>

        <SectionWithForm
          title="保険管理"
          icon={ShieldCheck}
          showForm={showInsuranceForm}
          onToggleForm={() => setShowInsuranceForm(!showInsuranceForm)}
          membersReady={membersReady}
          hasNoMembers={hasNoMembers}
          addLabel="保険を追加"
          formTitle="保険の追加"
          formContent={
            <InsuranceForm
              members={members}
              onSubmit={handleCreateInsurance}
              onCancel={() => setShowInsuranceForm(false)}
            />
          }
        >
          <InsuranceList
            insurances={insurances}
            isLoading={insurancesLoading}
            onUpdate={updateInsurance}
            onDelete={handleDeleteInsurance}
          />
        </SectionWithForm>

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
