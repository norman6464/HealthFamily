'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { MedicationHistoryList } from '@/components/history/MedicationHistoryList';
import { MedicationRecord, MedicationRecordEntity, DailyRecordGroup } from '@/domain/entities/MedicationRecord';
import { recordApi } from '@/data/api/recordApi';

export default function HistoryPage() {
  const [groups, setGroups] = useState<DailyRecordGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const records: MedicationRecord[] = await recordApi.getHistory();
      setGroups(MedicationRecordEntity.groupByDate(records));
    } catch {
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-primary-600">服薬履歴</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <MedicationHistoryList groups={groups} isLoading={isLoading} />
      </main>

      <BottomNavigation activePath="/history" />
    </div>
  );
}
