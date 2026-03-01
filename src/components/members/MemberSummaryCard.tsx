import React from 'react';
import { Pill, Calendar } from 'lucide-react';
import { MemberSummary, MemberSummaryEntity } from '../../domain/entities/MemberSummary';

interface MemberSummaryCardProps {
  summary: MemberSummary;
}

export const MemberSummaryCard: React.FC<MemberSummaryCardProps> = React.memo(({ summary }) => {
  const entity = new MemberSummaryEntity(summary);
  const appointmentLabel = entity.getAppointmentLabel();

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
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

MemberSummaryCard.displayName = 'MemberSummaryCard';
