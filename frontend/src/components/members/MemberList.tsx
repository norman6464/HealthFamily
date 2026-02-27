import React from 'react';
import { Member, MemberEntity } from '../../domain/entities/Member';
import { MemberIcon } from '../shared/MemberIcon';

interface MemberListProps {
  members: Member[];
  isLoading: boolean;
  onDelete: (memberId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ members, isLoading, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">メンバーがまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} onDelete={onDelete} />
      ))}
    </div>
  );
};

interface MemberCardProps {
  member: Member;
  onDelete: (memberId: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onDelete }) => {
  const entity = new MemberEntity(member);
  const displayInfo = entity.getDisplayInfo();
  const age = entity.getAge();

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
      data-testid="member-item"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MemberIcon memberType={displayInfo.memberType} petType={displayInfo.petType} size={28} className="text-gray-600" />
          <div>
            <p className="font-semibold text-gray-800">{displayInfo.name}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{displayInfo.typeLabel}</span>
              {age !== null && <span>{age}歳</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(member.id)}
          className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          aria-label="削除"
        >
          削除
        </button>
      </div>
      {member.notes && (
        <p className="mt-2 text-sm text-gray-500">{member.notes}</p>
      )}
    </div>
  );
};
