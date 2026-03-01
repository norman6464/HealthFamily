'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useMemberSummaries } from '@/presentation/hooks/useMemberSummaries';
import { MemberList } from '@/components/members/MemberList';
import { MemberForm, MemberFormData } from '@/components/members/MemberForm';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { Member } from '@/domain/entities/Member';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function Members() {
  const { userId } = useAuth();
  const { members, isLoading, createMember, updateMember, deleteMember } = useMembers(userId);
  const { summaries } = useMemberSummaries();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const handleCreate = async (data: MemberFormData) => {
    await createMember({
      userId,
      name: data.name,
      memberType: data.memberType,
      petType: data.petType,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      notes: data.notes,
    });
    setShowForm(false);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setShowForm(false);
  };

  const handleUpdate = async (data: MemberFormData) => {
    if (!editingMember) return;
    await updateMember(editingMember.id, {
      name: data.name,
      petType: data.petType,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      notes: data.notes,
    });
    setEditingMember(null);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">メンバー</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingMember(null);
            }}
            className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showForm ? '閉じる' : 'メンバーを追加'}
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
            <h2 className="text-sm font-semibold text-gray-700 mb-3">メンバー編集</h2>
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
          onDelete={deleteMember}
          onEdit={handleEdit}
          summaries={summaries}
        />
      </main>

      <BottomNavigation activePath="/members" />
    </div>
  );
}
