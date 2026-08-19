import { useMemo, useState } from "react";
import { useCreateMember, useUpdateMember, useDeleteMember } from "@/features/manage-members";
import { useAppointments } from "@/entities/appointment";
import { useMemberSummaries } from "@/entities/member";
import { Plus, X } from "lucide-react";
import type { Member } from "@/shared/api";
import { MemberList } from "./MemberList";
import { MemberForm, type MemberFormData } from "./MemberForm";
import type { MemberSummary } from "./MemberSummaryCard";

export default function Members() {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const { data: members = [], isLoading } = useMemberSummaries();

  const { data: appointments = [] } = useAppointments();

  // サーバ集計(activeMedicationCount)＋直近予約をビューモデルに合成する
  const summaries = useMemo<MemberSummary[]>(() => {
    const now = new Date();
    return members.map((member) => {
      const medicationCount = member.activeMedicationCount;
      const upcoming = appointments
        .filter(
          (a) => a.memberId === member.id && new Date(a.appointmentDate).getTime() >= now.getTime(),
        )
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
        );
      return {
        memberId: member.id,
        memberName: member.name,
        memberType: member.memberType,
        medicationCount,
        nextAppointmentDate: upcoming[0]?.appointmentDate ?? null,
      };
    });
  }, [members, appointments]);

  const createMutation = useCreateMember(() => setShowForm(false));
  const updateMutation = useUpdateMember(() => setEditingMember(null));
  const deleteMutation = useDeleteMember();

  const handleCreate = (data: MemberFormData) => {
    createMutation.mutate({
      name: data.name,
      memberType: data.memberType,
      petType: data.petType,
      birthDate: data.birthDate,
      notes: data.notes,
    });
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setShowForm(false);
  };

  const handleUpdate = (data: MemberFormData) => {
    if (!editingMember) return;
    updateMutation.mutate({
      id: editingMember.id,
      body: {
        name: data.name,
        petType: data.petType,
        birthDate: data.birthDate,
        notes: data.notes,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-ink-800 tracking-wide">メンバー</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingMember(null);
            }}
            className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showForm ? "閉じる" : "メンバーを追加"}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {showForm && (
          <div className="mb-6">
            <MemberForm onSubmit={handleCreate} />
          </div>
        )}

        {editingMember && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-primary-200">
            <h2 className="text-sm font-semibold text-ink-700 mb-3">メンバー編集</h2>
            <MemberForm
              onSubmit={handleUpdate}
              initialData={editingMember}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        <MemberList
          members={members}
          isLoading={isLoading}
          onDelete={(memberId) => {
            const member = members.find((m) => m.id === memberId);
            const name = member?.name || "このメンバー";
            if (
              window.confirm(
                `${name}を削除しますか？\n関連するお薬やスケジュールも全て削除されます。`,
              )
            ) {
              deleteMutation.mutate(memberId);
            }
          }}
          onEdit={handleEdit}
          summaries={summaries}
        />
      </main>
    </div>
  );
}
