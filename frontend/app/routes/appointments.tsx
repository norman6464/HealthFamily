import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { MapPin, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Appointment, Hospital, Member } from "@/lib/types";
import { TabSwitch } from "@/components/shared/TabSwitch";
import { MiniCalendar } from "@/components/appointments/MiniCalendar";
import { AppointmentForm, type AppointmentFormData } from "@/components/appointments/AppointmentForm";
import {
  AppointmentList,
  type AppointmentFilter,
  getAppointmentCounts,
} from "@/components/appointments/AppointmentList";

export default function Appointments() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentFilter>("upcoming");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: queryKeys.appointments.all,
    queryFn: () => api.get<Appointment[]>("/appointments"),
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: queryKeys.hospitals.all,
    queryFn: () => api.get<Hospital[]>("/hospitals"),
  });

  const hasNoMembers = !membersLoading && members.length === 0;

  const memberNameOf = (memberId: string): string =>
    members.find((m) => m.id === memberId)?.name ?? "";
  const hospitalNameOf = (hospitalId: string | null): string =>
    hospitalId ? (hospitals.find((h) => h.id === hospitalId)?.name ?? "") : "";

  const appointmentDates = useMemo(
    () => appointments.map((a) => new Date(a.appointmentDate)),
    [appointments],
  );
  const counts = useMemo(() => getAppointmentCounts(appointments), [appointments]);
  const tabs = useMemo(
    () => [
      { id: "upcoming", label: "今後の予定", count: counts.upcoming },
      { id: "past", label: "過去の予定", count: counts.past },
    ],
    [counts],
  );

  const createMutation = useMutation({
    mutationFn: (data: AppointmentFormData) =>
      api.post<Appointment>("/appointments", {
        memberId: data.memberId,
        hospitalId: data.hospitalId,
        appointmentDate: new Date(data.appointmentDate).toISOString(),
        type: data.type,
        notes: data.notes,
      }),
    onSuccess: () => {
      setShowForm(false);
      qc.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentFormData }) =>
      api.patch<Appointment>(`/appointments/${id}`, {
        appointmentDate: new Date(data.appointmentDate).toISOString(),
        hospitalId: data.hospitalId,
        type: data.type,
        notes: data.notes,
      }),
    onSuccess: () => {
      setEditingAppointment(null);
      qc.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
    onError: () => setUpdateError("更新に失敗しました。もう一度お試しください。"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  });

  const handleCreate = (data: AppointmentFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(false);
    setUpdateError(null);
  };

  useEffect(() => {
    if (editingAppointment && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingAppointment]);

  const handleUpdate = (data: AppointmentFormData) => {
    if (!editingAppointment) return;
    setUpdateError(null);
    updateMutation.mutate({ id: editingAppointment.id, data });
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  const handleDelete = (appointmentId: string) => {
    if (!window.confirm("この予約を削除しますか？")) return;
    deleteMutation.mutate(appointmentId);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-800 tracking-wide">通院管理</h1>
        <button
          onClick={handleToggleForm}
          className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
          aria-label={showForm ? "閉じる" : "予約を追加"}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showForm && !membersLoading && members.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">通院予約の追加</h2>
          <AppointmentForm members={members} hospitals={hospitals} onSubmit={handleCreate} />
        </div>
      )}

      {showForm && hasNoMembers && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          先に
          <Link to="/members" className="underline font-medium text-amber-800 hover:text-amber-900">
            メンバーページ
          </Link>
          でメンバーを登録してください。
        </div>
      )}

      {editingAppointment && !membersLoading && members.length > 0 && (
        <div ref={editFormRef} className="bg-white rounded-lg shadow-md p-4 border border-primary-200">
          <h2 className="text-sm font-semibold text-ink-700 mb-3">通院予約の編集</h2>
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

      <TabSwitch
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as AppointmentFilter)}
      />

      <AppointmentList
        appointments={appointments}
        isLoading={isLoading}
        filter={activeTab}
        memberNameOf={memberNameOf}
        hospitalNameOf={hospitalNameOf}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="mt-6">
        <Link
          to="/hospitals"
          className="flex items-center justify-between bg-white rounded-lg p-4 border border-primary-100 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <MapPin size={18} className="text-primary-600" />
            <span className="text-sm font-medium text-ink-700">かかりつけ医(病院)</span>
          </div>
          <span className="text-xs text-ink-400">{hospitals.length}件</span>
        </Link>
      </div>
    </div>
  );
}
