import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, X, Activity, Ruler, Thermometer } from "lucide-react";
import { HealthLogList } from "./HealthLogList";
import { HealthLogForm } from "./HealthLogForm";
import { HealthWeeklyTrend } from "./HealthWeeklyTrend";
import { SymptomFrequencySummary } from "./SymptomFrequencySummary";
import {
  BodyMeasurementForm,
  type BodyMeasurementFormData,
} from "./BodyMeasurementForm";
import { BodyMeasurementList } from "./BodyMeasurementList";
import {
  TemperatureForm,
  type TemperatureFormData,
} from "./TemperatureForm";
import { TemperatureChart } from "./TemperatureChart";
import { TemperatureRecordList } from "./TemperatureRecordList";
import {
  getDailyAverages,
  getMostFrequentSymptoms,
  useBodyMeasurements,
  useHealthLogs,
  useMembersQuery,
  useTemperatureRecords,
} from "../model/health-logs";

export default function HealthLogs() {
  const { data: members, isLoading: membersLoading } = useMembersQuery();
  const { logs, groups, isLoading, createLog, deleteLog } =
    useHealthLogs(members);
  const {
    measurements,
    isLoading: measurementsLoading,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
  } = useBodyMeasurements(members);
  const {
    records: temperatureRecords,
    isLoading: temperatureLoading,
    createRecord: createTemperature,
    deleteRecord: deleteTemperature,
  } = useTemperatureRecords(members);

  const [showForm, setShowForm] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [showTemperatureForm, setShowTemperatureForm] = useState(false);

  const weeklyAverages = useMemo(
    () => getDailyAverages(logs, 7, new Date()),
    [logs],
  );

  const frequentSymptoms = useMemo(
    () => getMostFrequentSymptoms(logs, 5),
    [logs],
  );

  const memberList = members ?? [];

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
    if (!window.confirm("この記録を削除しますか？")) return;
    await deleteMeasurement(id);
  };

  const handleCreateTemperature = async (data: TemperatureFormData) => {
    await createTemperature(data);
    setShowTemperatureForm(false);
  };

  const handleDeleteTemperature = async (id: string) => {
    if (!window.confirm("この体温記録を削除しますか？")) return;
    await deleteTemperature(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity size={22} className="text-primary-600" />
          <h1 className="text-xl font-bold text-ink-800 tracking-wide">
            体調記録
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-white text-sm rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} />
            <span>記録する</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4">
          <HealthLogForm
            members={memberList.map((m) => ({ id: m.id, name: m.name }))}
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
            <h2 className="text-base font-bold text-ink-800">体重・身長記録</h2>
          </div>
          <button
            onClick={() => setShowMeasurementForm(!showMeasurementForm)}
            className="bg-primary text-white p-1.5 rounded-full hover:bg-primary-dark transition-colors"
            aria-label={showMeasurementForm ? "閉じる" : "記録を追加"}
          >
            {showMeasurementForm ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {showMeasurementForm && !membersLoading && memberList.length > 0 && (
          <div className="mb-4 bg-white rounded-2xl shadow-sm p-4 border border-primary-100">
            <h3 className="text-sm font-semibold text-ink-700 mb-3">
              体重・身長の記録
            </h3>
            <BodyMeasurementForm
              members={memberList}
              onSubmit={handleCreateMeasurement}
              onCancel={() => setShowMeasurementForm(false)}
            />
          </div>
        )}

        {showMeasurementForm && !membersLoading && memberList.length === 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-700">
            先に
            <Link
              to="/members"
              className="underline font-medium text-yellow-800 hover:text-yellow-900"
            >
              メンバーページ
            </Link>
            でメンバーを登録してください。
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
            <h2 className="text-base font-bold text-ink-800">体温記録</h2>
          </div>
          <button
            onClick={() => setShowTemperatureForm(!showTemperatureForm)}
            className="bg-primary text-white p-1.5 rounded-full hover:bg-primary-dark transition-colors"
            aria-label={showTemperatureForm ? "閉じる" : "体温を追加"}
          >
            {showTemperatureForm ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {showTemperatureForm && !membersLoading && memberList.length > 0 && (
          <div className="mb-4">
            <TemperatureForm
              members={memberList.map((m) => ({ id: m.id, name: m.name }))}
              onSubmit={handleCreateTemperature}
              onCancel={() => setShowTemperatureForm(false)}
            />
          </div>
        )}

        {showTemperatureForm && !membersLoading && memberList.length === 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-700">
            先に
            <Link
              to="/members"
              className="underline font-medium text-yellow-800 hover:text-yellow-900"
            >
              メンバーページ
            </Link>
            でメンバーを登録してください。
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
    </div>
  );
}
