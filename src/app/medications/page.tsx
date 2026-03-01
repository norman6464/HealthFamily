'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useMedications } from '@/presentation/hooks/useMedications';
import { MedicationList } from '@/components/medications/MedicationList';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { MemberIcon } from '@/components/shared/MemberIcon';
import { MemberEntity, Member } from '@/domain/entities/Member';
import { recordApi } from '@/data/api/recordApi';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';

function MemberMedications({ member }: { member: Member }) {
  const { medications, isLoading, deleteMedication } = useMedications(member.id);
  const entity = new MemberEntity(member);
  const displayInfo = entity.getDisplayInfo();

  const handleMarkTaken = useCallback(async (medicationId: string) => {
    await recordApi.createRecord({
      memberId: member.id,
      medicationId,
    });
  }, [member.id]);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MemberIcon
            memberType={displayInfo.memberType}
            petType={displayInfo.petType}
            size={20}
            className="text-gray-600"
          />
          <h2 className="font-semibold text-gray-800">{displayInfo.name}</h2>
        </div>
        <Link
          href={`/members/${member.id}/medications`}
          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Plus size={14} />
          <span>追加</span>
        </Link>
      </div>
      <MedicationList
        medications={medications}
        isLoading={isLoading}
        onDelete={deleteMedication}
        onMarkTaken={handleMarkTaken}
      />
    </section>
  );
}

export default function Medications() {
  const { userId } = useAuth();
  const { members, isLoading } = useMembers(userId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary-600">お薬</h1>
          <Link
            href="/history"
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ClipboardList size={16} />
            <span>履歴</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12">
            <p className="text-gray-500 text-lg mb-4">メンバーがまだ登録されていません</p>
            <Link
              href="/members"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              メンバーを追加する
            </Link>
          </div>
        ) : (
          members.map((member) => (
            <MemberMedications key={member.id} member={member} />
          ))
        )}
      </main>

      <BottomNavigation activePath="/medications" />
    </div>
  );
}
