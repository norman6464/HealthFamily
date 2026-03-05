'use client';

import { useState, useMemo } from 'react';
import { Plus, Activity } from 'lucide-react';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { HealthLogList } from '@/components/health-logs/HealthLogList';
import { HealthLogForm } from '@/components/health-logs/HealthLogForm';
import { HealthWeeklyTrend } from '@/components/health-logs/HealthWeeklyTrend';
import { useHealthLogs } from '@/presentation/hooks/useHealthLogs';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

export default function HealthLogsPage() {
  const { userId } = useAuth();
  const { groups, isLoading, createLog, deleteLog } = useHealthLogs();
  const { members } = useMembers(userId ?? '');
  const [showForm, setShowForm] = useState(false);

  const allLogs = useMemo(
    () => groups.flatMap((g) => g.logs),
    [groups],
  );

  const weeklyAverages = useMemo(
    () => HealthLogEntity.getDailyAverages(allLogs, 7, new Date()),
    [allLogs],
  );

  const handleSubmit = async (input: {
    memberId: string;
    conditionLevel: number;
    symptoms?: string[];
    notes?: string;
  }) => {
    await createLog(input);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity size={22} className="text-primary-600" />
            <h1 className="text-xl font-bold text-primary-600">体調記録</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              <span>記録する</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {showForm && (
          <div className="mb-4">
            <HealthLogForm
              members={members.map((m) => ({ id: m.id, name: m.name }))}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <HealthWeeklyTrend averages={weeklyAverages} />

        <HealthLogList groups={groups} isLoading={isLoading} onDelete={deleteLog} />
      </main>

      <BottomNavigation activePath="/health-logs" />
    </div>
  );
}
