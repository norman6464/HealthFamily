'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { MemberList } from '@/components/members/MemberList';
import { MemberForm, MemberFormData } from '@/components/members/MemberForm';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function Members() {
  const { userId } = useAuth();
  const { members, isLoading, createMember, deleteMember } = useMembers(userId);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">メンバー</h1>
          <button
            onClick={() => setShowForm(!showForm)}
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

        <MemberList
          members={members}
          isLoading={isLoading}
          onDelete={deleteMember}
        />
      </main>

      <BottomNavigation activePath="/members" />
    </div>
  );
}
