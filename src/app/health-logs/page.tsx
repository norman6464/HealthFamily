'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, X, Activity, Ruler, Thermometer } from 'lucide-react';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { HealthLogList } from '@/components/health-logs/HealthLogList';
import { HealthLogForm } from '@/components/health-logs/HealthLogForm';
import { HealthWeeklyTrend } from '@/components/health-logs/HealthWeeklyTrend';
import { SymptomFrequencySummary } from '@/components/health-logs/SymptomFrequencySummary';
import { useHealthLogs } from '@/presentation/hooks/useHealthLogs';
import { useBodyMeasurements } from '@/presentation/hooks/useBodyMeasurements';
import { useTemperatureRecords } from '@/presentation/hooks/useTemperatureRecords';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { HealthLogEntity } from '@/domain/entities/HealthLog';
import { BodyMeasurementForm, BodyMeasurementFormData } from '@/components/body-measurements/BodyMeasurementForm';
import { BodyMeasurementList } from '@/components/body-measurements/BodyMeasurementList';
import { TemperatureForm, TemperatureFormData } from '@/components/temperatures/TemperatureForm';
import { TemperatureChart } from '@/components/temperatures/TemperatureChart';
import { TemperatureRecordList } from '@/components/temperatures/TemperatureRecordList';

export default function HealthLogsPage() {
  const { userId, isLoading: authLoading } = useAuth();
  const { groups, isLoading, createLog, deleteLog } = useHealthLogs();
  const { members, isLoading: membersLoading } = useMembers(userId ?? '');
  const { measurements, isLoading: measurementsLoading, createMeasurement, updateMeasurement, deleteMeasurement } = useBodyMeasurements();
  const { records: temperatureRecords, isLoading: temperatureLoading, createRecord: createTemperature, deleteRecord: deleteTemperature } = useTemperatureRecords();
  const [showForm, setShowForm] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showTemperatureForm, setShowTemperatureForm] = useState(false);

  const allLogs = useMemo(
    () => groups.flatMap((g) => g.logs),
    [groups],
  );

  const weeklyAverages = useMemo(
    () => HealthLogEntity.getDailyAverages(allLogs, 7, new Date()),
    [allLogs],
  );

  const frequentSymptoms = useMemo(
    () => HealthLogEntity.getMostFrequentSymptoms(allLogs, 5),
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

  const handleCreateMeasurement = async (data: BodyMeasurementFormData) => {
    await createMeasurement(data);
    setShowMeasurementForm(false);
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    await deleteMeasurement(id);
  };

  const handleCreateTemperature = async (data: TemperatureFormData) => {
    await createTemperature(data);
    setShowTemperatureForm(false);
  };

  const handleDeleteTemperature = async (id: string) => {
    if (!window.confirm('この体温記録を削除しますか？')) return;
    await deleteTemperature(id);
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity size={22} className="text-primary-600" />
            <h1 className="text-xl font-bold text-white tracking-wide">体調記録</h1>
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

        <SymptomFrequencySummary symptoms={frequentSymptoms} />

        <HealthLogList groups={groups} isLoading={isLoading} onDelete={deleteLog} />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Ruler size={18} className="text-primary-600" />
              <h2 className="text-base font-bold text-gray-800">体重・身長記録</h2>
            </div>
            <button
              onClick={() => setShowMeasurementForm(!showMeasurementForm)}
              className="bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
              aria-label={showMeasurementForm ? '閉じる' : '記録を追加'}
            >
              {showMeasurementForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showMeasurementForm && !authLoading && !membersLoading && members.length > 0 && (
            <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">体重・身長の記録</h3>
              <BodyMeasurementForm
                members={members}
                onSubmit={handleCreateMeasurement}
                onCancel={() => setShowMeasurementForm(false)}
              />
            </div>
          )}

          {showMeasurementForm && !authLoading && !membersLoading && members.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
              先に<Link href="/members" className="underline font-medium text-yellow-800 hover:text-yellow-900">メンバーページ</Link>でメンバーを登録してください。
            </div>
          )}

          <BodyMeasurementList
            measurements={measurements}
            isLoading={measurementsLoading}
            onUpdate={updateMeasurement}
            onDelete={handleDeleteMeasurement}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Thermometer size={18} className="text-primary-600" />
              <h2 className="text-base font-bold text-gray-800">体温記録</h2>
            </div>
            <button
              onClick={() => setShowTemperatureForm(!showTemperatureForm)}
              className="bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
              aria-label={showTemperatureForm ? '閉じる' : '体温を追加'}
            >
              {showTemperatureForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showTemperatureForm && !authLoading && !membersLoading && members.length > 0 && (
            <div className="mb-4">
              <TemperatureForm
                members={members}
                onSubmit={handleCreateTemperature}
                onCancel={() => setShowTemperatureForm(false)}
              />
            </div>
          )}

          {showTemperatureForm && !authLoading && !membersLoading && members.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
              先に<Link href="/members" className="underline font-medium text-yellow-800 hover:text-yellow-900">メンバーページ</Link>でメンバーを登録してください。
            </div>
          )}

          <div className="mb-3">
            <TemperatureChart records={temperatureRecords} />
          </div>

          <TemperatureRecordList
            records={temperatureRecords}
            isLoading={temperatureLoading}
            onDelete={handleDeleteTemperature}
          />
        </div>
      </main>

      <BottomNavigation activePath="/health-logs" />
    </div>
  );
}
