import React from "react";
import { Pill, Calendar } from "lucide-react";

export interface MemberSummary {
  memberId: string;
  memberName: string;
  memberType: string;
  medicationCount: number;
  nextAppointmentDate: string | null;
}

interface MemberSummaryCardProps {
  summary: MemberSummary;
}

function diffDays(from: Date, to: Date): number {
  const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round(
    (toStartOfDay(to).getTime() - toStartOfDay(from).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getAppointmentLabel(nextAppointmentDate: string | null): string {
  if (!nextAppointmentDate) return "";
  const days = diffDays(new Date(), new Date(nextAppointmentDate));
  if (days === 0) return "今日";
  if (days === 1) return "明日";
  return `${days}日後`;
}

export const MemberSummaryCard: React.FC<MemberSummaryCardProps> = React.memo(({ summary }) => {
  const appointmentLabel = getAppointmentLabel(summary.nextAppointmentDate);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2 text-sm text-ink-600">
        <Pill size={14} />
        <span>{summary.medicationCount}種類</span>
      </div>
      {appointmentLabel && (
        <div className="flex items-center space-x-1 text-sm text-orange-600">
          <Calendar size={14} />
          <span>次回通院: {appointmentLabel}</span>
        </div>
      )}
    </div>
  );
});

MemberSummaryCard.displayName = "MemberSummaryCard";
