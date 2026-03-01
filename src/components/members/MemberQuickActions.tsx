'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Clock } from 'lucide-react';
import { Member } from '../../domain/entities/Member';
import { MemberIcon } from '../shared/MemberIcon';

interface MemberQuickActionsProps {
  member: Member;
  medicationCount: number;
  scheduleCount: number;
}

export const MemberQuickActions: React.FC<MemberQuickActionsProps> = ({ member, medicationCount, scheduleCount }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
      <div className="flex items-center space-x-2 mb-2">
        <MemberIcon memberType={member.memberType} petType={member.petType} size={18} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-800">{member.name}</span>
      </div>
      <div className="flex space-x-2">
        <Link
          href={`/members/${member.id}/medications`}
          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-primary-50 text-primary-700 rounded text-xs hover:bg-primary-100 transition-colors"
        >
          <Pill size={12} />
          <span>薬管理</span>
          <span className="text-primary-500">{medicationCount}件</span>
        </Link>
        <div className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gray-50 text-gray-600 rounded text-xs">
          <Clock size={12} />
          <span>スケジュール</span>
          <span className="text-gray-400">{scheduleCount}件</span>
        </div>
      </div>
    </div>
  );
};
