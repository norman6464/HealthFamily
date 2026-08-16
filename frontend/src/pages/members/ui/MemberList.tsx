import React from "react";
import { getMemberAge } from "@/entities/member";
import { Link } from "react-router";
import { Pill, Pencil } from "lucide-react";
import type { Member } from "@/shared/api";
import { MemberIcon, type MemberType, type PetType } from "@/shared/ui";
import { LoadingSpinner } from "@/shared/ui";
import { EmptyStatePrompt } from "@/shared/ui";
import { MemberSummaryCard, type MemberSummary } from "./MemberSummaryCard";

interface MemberListProps {
  members: Member[];
  isLoading: boolean;
  onDelete: (memberId: string) => void;
  onEdit?: (member: Member) => void;
  summaries?: MemberSummary[];
}

const memberTypeLabels: Record<string, string> = {
  human: "家族",
  pet: "ペット",
};

export const MemberList: React.FC<MemberListProps> = ({
  members,
  isLoading,
  onDelete,
  onEdit,
  summaries,
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (members.length === 0) {
    return (
      <EmptyStatePrompt
        message="メンバーがまだ登録されていません"
        subMessage="上のフォームからメンバーを追加してください"
      />
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onDelete={onDelete}
          onEdit={onEdit}
          summary={summaries?.find((s) => s.memberId === member.id)}
        />
      ))}
    </div>
  );
};

export interface MemberCardProps {
  member: Member;
  onDelete: (memberId: string) => void;
  onEdit?: (member: Member) => void;
  summary?: MemberSummary;
}

const MemberCard: React.FC<MemberCardProps> = React.memo(({ member, onDelete, onEdit, summary }) => {
  const age = getMemberAge(member.birthDate);
  const typeLabel = memberTypeLabels[member.memberType] ?? member.memberType;

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-primary-100"
      data-testid="member-item"
    >
      <div className="flex items-center justify-between">
        <Link
          to={`/members/${member.id}`}
          className="flex items-center space-x-3 flex-1 min-w-0 rounded-md hover:bg-primary-50 transition-colors -m-1 p-1"
        >
          <MemberIcon
            memberType={member.memberType as MemberType}
            petType={(member.petType ?? undefined) as PetType | undefined}
            size={28}
            className="text-ink-600"
          />
          <div>
            <p className="font-semibold text-ink-800">{member.name}</p>
            <div className="flex items-center space-x-2 text-sm text-ink-500">
              <span>{typeLabel}</span>
              {age !== null && <span>{age}歳</span>}
            </div>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <Link
            to={`/members/${member.id}/medications`}
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm px-3 py-1 rounded-md hover:bg-primary-50 transition-colors"
            aria-label="薬管理"
          >
            <Pill size={14} />
            <span>薬管理</span>
          </Link>
          {onEdit && (
            <button
              onClick={() => onEdit(member)}
              className="text-ink-500 hover:text-ink-700 text-sm px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
              aria-label="編集"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(member.id)}
            className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
            aria-label="削除"
          >
            削除
          </button>
        </div>
      </div>
      {summary && <MemberSummaryCard summary={summary} />}
      {member.notes && <p className="mt-2 text-sm text-ink-500">{member.notes}</p>}
    </div>
  );
});

MemberCard.displayName = "MemberCard";
