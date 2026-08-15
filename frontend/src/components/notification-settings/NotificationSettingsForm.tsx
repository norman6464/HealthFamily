import { useState, useEffect } from "react";
import { Bell, BellOff, Mail, Clock, Calendar } from "lucide-react";
import type { NotificationSetting } from "@/lib/types";

export type UpdateNotificationSettingInput = Partial<{
  medicationReminderEnabled: boolean;
  missedMedicationEnabled: boolean;
  appointmentReminderEnabled: boolean;
  lowStockAlertEnabled: boolean;
  defaultReminderMinutesBefore: number;
  defaultAppointmentReminderDaysBefore: number;
  emailNotificationEnabled: boolean;
}>;

type NotificationTypeKey =
  | "medication_reminder"
  | "missed_medication"
  | "appointment_reminder"
  | "low_stock";

const NOTIFICATION_TYPES: ReadonlyArray<{
  key: NotificationTypeKey;
  label: string;
  description: string;
}> = [
  {
    key: "medication_reminder",
    label: "服薬リマインダー",
    description: "服薬時間になったら通知します",
  },
  {
    key: "missed_medication",
    label: "飲み忘れ通知",
    description: "服薬時間を過ぎても記録がない場合に通知します",
  },
  {
    key: "appointment_reminder",
    label: "通院リマインダー",
    description: "通院予約の前日に通知します",
  },
  {
    key: "low_stock",
    label: "在庫アラート",
    description: "お薬の在庫が少なくなったら通知します",
  },
];

const DEFAULT_NOTIFICATION_SETTING = {
  medicationReminderEnabled: true,
  missedMedicationEnabled: true,
  appointmentReminderEnabled: true,
  lowStockAlertEnabled: true,
  defaultReminderMinutesBefore: 5,
  defaultAppointmentReminderDaysBefore: 1,
  emailNotificationEnabled: true,
} as const;

interface NotificationSettingsFormProps {
  setting: NotificationSetting | null;
  onSave: (input: UpdateNotificationSettingInput) => Promise<void>;
  isLoading: boolean;
}

const REMINDER_MINUTES_OPTIONS = [
  { value: 0, label: "なし" },
  { value: 5, label: "5分前" },
  { value: 10, label: "10分前" },
  { value: 15, label: "15分前" },
  { value: 30, label: "30分前" },
  { value: 60, label: "1時間前" },
];

const APPOINTMENT_DAYS_OPTIONS = [
  { value: 0, label: "当日" },
  { value: 1, label: "1日前" },
  { value: 2, label: "2日前" },
  { value: 3, label: "3日前" },
  { value: 7, label: "1週間前" },
];

const NOTIFICATION_FIELD_MAP: Record<NotificationTypeKey, keyof UpdateNotificationSettingInput> = {
  medication_reminder: "medicationReminderEnabled",
  missed_medication: "missedMedicationEnabled",
  appointment_reminder: "appointmentReminderEnabled",
  low_stock: "lowStockAlertEnabled",
};

export function NotificationSettingsForm({ setting, onSave, isLoading }: NotificationSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [enabledTypes, setEnabledTypes] = useState<Record<NotificationTypeKey, boolean>>({
    medication_reminder: true,
    missed_medication: true,
    appointment_reminder: true,
    low_stock: true,
  });
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [appointmentDays, setAppointmentDays] = useState(1);

  useEffect(() => {
    const s = setting ?? DEFAULT_NOTIFICATION_SETTING;
    setEmailEnabled(s.emailNotificationEnabled);
    setEnabledTypes({
      medication_reminder: s.medicationReminderEnabled,
      missed_medication: s.missedMedicationEnabled,
      appointment_reminder: s.appointmentReminderEnabled,
      low_stock: s.lowStockAlertEnabled,
    });
    setReminderMinutes(s.defaultReminderMinutesBefore);
    setAppointmentDays(s.defaultAppointmentReminderDaysBefore);
  }, [setting]);

  const handleToggleType = async (typeKey: NotificationTypeKey) => {
    const prevValue = enabledTypes[typeKey];
    const newValue = !prevValue;
    setEnabledTypes((prev) => ({ ...prev, [typeKey]: newValue }));
    const field = NOTIFICATION_FIELD_MAP[typeKey];
    setIsSaving(true);
    try {
      await onSave({ [field]: newValue });
    } catch {
      setEnabledTypes((prev) => ({ ...prev, [typeKey]: prevValue }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmail = async () => {
    const prevValue = emailEnabled;
    const newValue = !prevValue;
    setEmailEnabled(newValue);
    setIsSaving(true);
    try {
      await onSave({ emailNotificationEnabled: newValue });
    } catch {
      setEmailEnabled(prevValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReminderMinutesChange = async (value: number) => {
    const prevValue = reminderMinutes;
    setReminderMinutes(value);
    setIsSaving(true);
    try {
      await onSave({ defaultReminderMinutesBefore: value });
    } catch {
      setReminderMinutes(prevValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppointmentDaysChange = async (value: number) => {
    const prevValue = appointmentDays;
    setAppointmentDays(value);
    setIsSaving(true);
    try {
      await onSave({ defaultAppointmentReminderDaysBefore: value });
    } catch {
      setAppointmentDays(prevValue);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail size={18} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-ink-800">メール通知</h2>
          </div>
          <button
            onClick={handleToggleEmail}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailEnabled ? "bg-primary-600" : "bg-ink-300"
            }`}
            role="switch"
            aria-checked={emailEnabled}
            aria-label="メール通知の切り替え"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-ink-500 mt-1">
          メール通知を無効にすると、すべての通知が停止します
        </p>
      </section>

      <section className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
        <div className="flex items-center space-x-2 mb-4">
          {emailEnabled ? (
            <Bell size={18} className="text-primary-600" />
          ) : (
            <BellOff size={18} className="text-ink-400" />
          )}
          <h2 className="text-lg font-semibold text-ink-800">通知の種類</h2>
        </div>
        <div className="space-y-3">
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                emailEnabled ? "border-primary-100 bg-white" : "border-primary-50 bg-primary-50/40"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${emailEnabled ? "text-ink-800" : "text-ink-400"}`}>
                  {type.label}
                </p>
                <p className={`text-xs ${emailEnabled ? "text-ink-500" : "text-ink-400"}`}>
                  {type.description}
                </p>
              </div>
              <button
                onClick={() => handleToggleType(type.key)}
                disabled={!emailEnabled || isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-3 ${
                  enabledTypes[type.key] && emailEnabled ? "bg-primary-600" : "bg-ink-300"
                } ${!emailEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                role="switch"
                aria-checked={enabledTypes[type.key]}
                aria-label={`${type.label}の切り替え`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabledTypes[type.key] && emailEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
        <div className="flex items-center space-x-2 mb-4">
          <Clock size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-ink-800">デフォルトリマインダー</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="reminder-minutes" className="block text-sm font-medium text-ink-700 mb-1">
              服薬リマインダー（何分前）
            </label>
            <select
              id="reminder-minutes"
              value={reminderMinutes}
              onChange={(e) => handleReminderMinutesChange(Number(e.target.value))}
              disabled={!emailEnabled || isSaving}
              className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-primary-50 disabled:text-ink-400"
            >
              {REMINDER_MINUTES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="appointment-days" className="block text-sm font-medium text-ink-700 mb-1">
              <span className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>通院リマインダー（何日前）</span>
              </span>
            </label>
            <select
              id="appointment-days"
              value={appointmentDays}
              onChange={(e) => handleAppointmentDaysChange(Number(e.target.value))}
              disabled={!emailEnabled || isSaving}
              className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-primary-50 disabled:text-ink-400"
            >
              {APPOINTMENT_DAYS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
