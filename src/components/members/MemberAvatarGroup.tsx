'use client';

interface AvatarMember {
  id: string;
  name: string;
  memberType: 'human' | 'pet';
}

interface MemberAvatarGroupProps {
  members: AvatarMember[];
  max?: number;
}

export function MemberAvatarGroup({ members, max = 5 }: MemberAvatarGroupProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((member) => (
        <div
          key={member.id}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${
            member.memberType === 'pet' ? 'bg-amber-500' : 'bg-primary-500'
          }`}
          title={member.name}
        >
          {member.name.charAt(0)}
        </div>
      ))}
      {remaining > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs font-bold text-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}
