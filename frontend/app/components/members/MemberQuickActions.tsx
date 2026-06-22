import React from "react";
import { Link } from "react-router";
import { Pill, Clock } from "lucide-react";
import type { Member } from "@/lib/types";
import { MemberIcon, type MemberType, type PetType } from "@/components/shared/MemberIcon";

interface MemberQuickActionsProps {
  member: Member;
  medicationCount: number;
  scheduleCount: number;
}

export const MemberQuickActions: React.FC<MemberQuickActionsProps> = ({
  member,
  medicationCount,
  scheduleCount,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-100">
      <div className="flex items-center space-x-2 mb-2">
        <MemberIcon
          memberType={member.memberType as MemberType}
          petType={(member.petType ?? undefined) as PetType | undefined}
          size={18}
          className="text-ink-600"
        />
        <span className="text-sm font-medium text-ink-800">{member.name}</span>
      </div>
      <div className="flex space-x-2">
        <Link
          to={`/members/${member.id}/medications`}
          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-primary-50 text-primary-700 rounded text-xs hover:bg-primary-100 transition-colors"
        >
          <Pill size={12} />
          <span>薬管理</span>
          <span className="text-primary-500">{medicationCount}件</span>
        </Link>
        <div className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-primary-50 text-ink-600 rounded text-xs">
          <Clock size={12} />
          <span>スケジュール</span>
          <span className="text-ink-400">{scheduleCount}件</span>
        </div>
      </div>
    </div>
  );
};
