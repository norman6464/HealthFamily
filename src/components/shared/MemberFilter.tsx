import React from 'react';

export interface MemberOption {
  id: string;
  name: string;
}

interface MemberFilterProps {
  members: MemberOption[];
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
}

export const MemberFilter: React.FC<MemberFilterProps> = ({ members, selectedMemberId, onSelect }) => {
  if (members.length === 0) return null;

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2" role="tablist" aria-label="メンバーフィルター">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          selectedMemberId === null
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        role="tab"
        aria-selected={selectedMemberId === null}
      >
        全員
      </button>
      {members.map((member) => (
        <button
          key={member.id}
          onClick={() => onSelect(member.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedMemberId === member.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          role="tab"
          aria-selected={selectedMemberId === member.id}
        >
          {member.name}
        </button>
      ))}
    </div>
  );
};
