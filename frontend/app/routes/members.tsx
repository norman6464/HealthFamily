import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Appointment, Member, MemberWithCounts } from "@/lib/types";
import { MemberList } from "@/components/members/MemberList";
import { MemberForm, type MemberFormData } from "@/components/members/MemberForm";
import type { MemberSummary } from "@/components/members/MemberSummaryCard";

interface CreateMemberBody {
  name: string;
  memberType: string;
  petType?: string;
  birthDate?: string;
  notes?: string;
}

interface UpdateMemberBody {
  name?: string;
  petType?: string;
  birthDate?: string;
  notes?: string;
}

export default function Members() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // サーバ集計の /members/summary を使用（全medications取得＋クライアント集計のN+1を解消）
  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<MemberWithCounts[]>("/members/summary"),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: queryKeys.appointments.all,
    queryFn: () => api.get<Appointment[]>("/appointments"),
  });

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

  const createMutation = useMutation({
    mutationFn: (body: CreateMemberBody) => api.post<Member>("/members", body),
    onSuccess: () => {
      setShowForm(false);
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMemberBody }) =>
      api.patch<Member>(`/members/${id}`, body),
    onSuccess: () => {
      setEditingMember(null);
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members.all }),
  });

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
