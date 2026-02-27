import { useState } from 'react';
import { useMembers } from '../presentation/hooks/useMembers';
import { MemberList } from '../components/members/MemberList';
import { MemberForm, MemberFormData } from '../components/members/MemberForm';
import { BottomNavigation } from '../components/shared/BottomNavigation';
import { useAuthStore } from '../stores/authStore';

export default function Members() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId || '';
  const { members, isLoading, createMember, deleteMember } = useMembers(userId);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: MemberFormData) => {
    await createMember({
      userId,
      memberType: data.memberType,
      name: data.name,
      petType: data.petType,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      notes: data.notes,
    });
    setShowForm(false);
  };

  const handleDelete = async (memberId: string) => {
    await deleteMember(memberId);
  };

  return (
    <>
      <main className="max-w-md mx-auto p-4 pb-20">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-primary-700">メンバー管理</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            aria-expanded={showForm}
            aria-controls="member-form-section"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            {showForm ? '閉じる' : '+ 追加'}
          </button>
        </header>

        {showForm && (
          <div id="member-form-section" className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">新しいメンバーを追加</h2>
            <MemberForm onSubmit={handleSubmit} />
          </div>
        )}

        <section aria-label="メンバー一覧">
          <MemberList members={members} isLoading={isLoading} onDelete={handleDelete} />
        </section>
      </main>

      <BottomNavigation activePath="/members" />
    </>
  );
}
