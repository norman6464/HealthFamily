import { useState } from 'react';
import { useMembers } from '../presentation/hooks/useMembers';
import { MemberList } from '../components/members/MemberList';
import { MemberForm, MemberFormData } from '../components/members/MemberForm';
import { BottomNavigation } from '../components/shared/BottomNavigation';

export default function Members() {
  const { members, isLoading, createMember, deleteMember } = useMembers('user-1'); // TODO: 実際のuserIdに置き換え
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (data: MemberFormData) => {
    await createMember({
      userId: 'user-1', // TODO: 実際のuserIdに置き換え
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
    <div className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-primary-700">メンバー管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          {showForm ? '閉じる' : '+ 追加'}
        </button>
      </header>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">新しいメンバーを追加</h2>
          <MemberForm onSubmit={handleSubmit} />
        </div>
      )}

      <section>
        <MemberList members={members} isLoading={isLoading} onDelete={handleDelete} />
      </section>

      <BottomNavigation activePath="/members" />
    </div>
  );
}
