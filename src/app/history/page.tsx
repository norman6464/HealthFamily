'use client';

import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { MedicationHistoryList } from '@/components/history/MedicationHistoryList';
import { useMedicationHistory } from '@/presentation/hooks/useMedicationHistory';

export default function HistoryPage() {
  const { groups, isLoading, deleteRecord } = useMedicationHistory();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-primary-600">服薬履歴</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <MedicationHistoryList groups={groups} isLoading={isLoading} onDelete={deleteRecord} />
      </main>

      <BottomNavigation activePath="/history" />
    </div>
  );
}
