import { useEffect, useMemo, useState } from "react";
import { useCreateMedicationRaw, useDeleteMedication } from "@/features/manage-medications";
import { useCreateSchedule, useDeleteSchedule } from "@/features/manage-schedules";
import { useSchedules } from "@/entities/schedule";
import { useMemberMedications } from "@/entities/medication";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, X, Clock, Pill, Trash2 } from "lucide-react";
import type { Medication } from "@/shared/api";
import { Button, Card, ErrorText, Input } from "@/shared/ui";
import { LoadingSpinner } from "@/shared/ui";
import { EmptyStatePrompt } from "@/shared/ui";

const DAY_LABELS: Record<string, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};

export default function MemberMedications() {
  const { memberId = "" } = useParams();
  const navigate = useNavigate();

  const [showMedForm, setShowMedForm] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("");
  const [medInstructions, setMedInstructions] = useState("");
  const [medError, setMedError] = useState<string | null>(null);

  const [scheduleTarget, setScheduleTarget] = useState<Medication | null>(null);
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [reminderMinutes, setReminderMinutes] = useState("10");
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { data: medications = [], isLoading } = useMemberMedications(memberId);

  const { data: allSchedules = [], isLoading: schedulesLoading } = useSchedules();

  const memberSchedules = useMemo(
    () => allSchedules.filter((s) => s.memberId === memberId),
    [allSchedules, memberId],
  );

  const medicationName = (id: string) =>
    medications.find((m) => m.id === id)?.name ?? "";

  const createMedMutation = useCreateMedicationRaw(memberId, () => {
    setMedName("");
    setMedDosage("");
    setMedFrequency("");
    setMedInstructions("");
    setMedError(null);
    setShowMedForm(false);
  });
  const deleteMedMutation = useDeleteMedication(memberId);

  const createScheduleMutation = useCreateSchedule(() => {
    setScheduleTarget(null);
    setScheduledTime("08:00");
    setReminderMinutes("10");
    setScheduleError(null);
  });
  const deleteScheduleMutation = useDeleteSchedule();

  // 作成の失敗はこの画面のフォーム内に出す。features 側で固定すると
  // 画面ごとの出し分けができない
  useEffect(() => {
    if (createMedMutation.error) setMedError(createMedMutation.error.message);
  }, [createMedMutation.error]);

  useEffect(() => {
    if (createScheduleMutation.error) setScheduleError(createScheduleMutation.error.message);
  }, [createScheduleMutation.error]);

  const handleCreateMedication = () => {
    if (!medName.trim()) return;
    createMedMutation.mutate({
      memberId,
      name: medName.trim(),
      category: "regular",
      dosageAmount: medDosage.trim() || undefined,
      frequency: medFrequency.trim() || undefined,
      instructions: medInstructions.trim() || undefined,
    });
  };

  const handleCreateSchedule = () => {
    if (!scheduleTarget) return;
    createScheduleMutation.mutate({
      medicationId: scheduleTarget.id,
      memberId,
      scheduledTime,
      daysOfWeek: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      reminderMinutesBefore: parseInt(reminderMinutes, 10) || 0,
    });
  };

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/members")}
              className="text-ink-600 hover:text-ink-800 transition-colors"
              aria-label="メンバー一覧に戻る"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-ink-800 tracking-wide">薬管理</h1>
          </div>
          <button
            onClick={() => setShowMedForm(!showMedForm)}
            className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showMedForm ? "閉じる" : "薬を追加"}
          >
            {showMedForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {showMedForm && (
          <div className="mb-6">
            <Card>
              <div className="space-y-3">
                <Input
                  placeholder="薬の名前"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                />
                <Input
                  placeholder="用量（例: 1錠）"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                />
                <Input
                  placeholder="服用回数（例: 1日3回）"
                  value={medFrequency}
                  onChange={(e) => setMedFrequency(e.target.value)}
                />
                <Input
                  placeholder="服用方法・メモ（任意）"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                />
                <ErrorText>{medError}</ErrorText>
                <Button
                  onClick={handleCreateMedication}
                  disabled={createMedMutation.isPending}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> 追加する
                </Button>
              </div>
            </Card>
          </div>
        )}

        {scheduleTarget && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-primary-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock size={18} className="text-primary-600" />
                <h2 className="font-semibold text-ink-800">
                  {scheduleTarget.name} のスケジュール
                </h2>
              </div>
              <button
                onClick={() => setScheduleTarget(null)}
                className="text-ink-400 hover:text-ink-600 transition-colors"
                aria-label="閉じる"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="scheduled-time"
                  className="block text-sm font-medium text-ink-700 mb-1"
                >
                  時刻
                </label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="reminder-minutes"
                  className="block text-sm font-medium text-ink-700 mb-1"
                >
                  通知（何分前）
                </label>
                <Input
                  id="reminder-minutes"
                  type="number"
                  min={0}
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value)}
                />
              </div>
              <ErrorText>{scheduleError}</ErrorText>
              <Button
                onClick={handleCreateSchedule}
                disabled={createScheduleMutation.isPending}
                className="w-full"
              >
                スケジュールを追加
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : medications.length === 0 ? (
          <EmptyStatePrompt
            message="お薬がまだ登録されていません"
            subMessage="右上のボタンからお薬を追加してください"
          />
        ) : (
          <div className="space-y-2">
            {medications.map((med) => (
              <Card key={med.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Pill className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-ink-800">{med.name}</p>
                    <p className="text-xs text-ink-500">
                      {[med.dosageAmount, med.frequency].filter(Boolean).join("・")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMedMutation.mutate(med.id)}
                  className="text-ink-400 hover:text-red-500"
                  aria-label="削除"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </Card>
            ))}
          </div>
        )}

        {medications.length > 0 && !scheduleTarget && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-ink-600 mb-3">スケジュール追加</h2>
            <div className="space-y-2">
              {medications.map((med) => (
                <button
                  key={med.id}
                  onClick={() => setScheduleTarget(med)}
                  className="w-full flex items-center justify-between bg-white rounded-lg p-3 border border-primary-100 hover:border-primary-300 transition-colors text-left"
                >
                  <span className="text-sm text-ink-700">{med.name}</span>
                  <Clock size={16} className="text-ink-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {memberSchedules.length > 0 && (
          <div id="schedules" className="mt-6">
            <h2 className="text-sm font-medium text-ink-600 mb-3">スケジュール管理</h2>
            {schedulesLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-2">
                {memberSchedules.map((schedule) => (
                  <Card key={schedule.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-medium text-ink-800">
                          {medicationName(schedule.medicationId)}
                        </p>
                        <p className="text-xs text-ink-500">
                          {schedule.scheduledTime}
                          {schedule.daysOfWeek.length > 0 &&
                            schedule.daysOfWeek.length < 7 &&
                            `・${schedule.daysOfWeek.map((d) => DAY_LABELS[d] ?? d).join("")}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                      className="text-ink-400 hover:text-red-500"
                      aria-label="削除"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
