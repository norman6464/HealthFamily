import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import { useResource } from "@/shared/api";
import type {
  BodyMeasurement,
  HealthLog,
  Member,
  TemperatureRecord,
} from "@/shared/api";

// ---------------------------------------------------------------------------
// 体調記録ドメインロジック（旧 HealthLogEntity / TemperatureRecordEntity から移植）
// ---------------------------------------------------------------------------

export const CONDITION_LEVELS = [1, 2, 3, 4, 5] as const;
export type ConditionLevel = (typeof CONDITION_LEVELS)[number];

export const SYMPTOM_OPTIONS = [
  "headache",
  "fever",
  "fatigue",
  "nausea",
  "stomachache",
  "dizziness",
  "cough",
  "runny_nose",
  "joint_pain",
  "insomnia",
  "menstrual_pain",
  "vomiting",
  "diarrhea",
  "bloody_urine",
  "bleeding",
  "eye_discharge",
  "loss_of_appetite",
  "lethargy",
] as const;
export type SymptomType = (typeof SYMPTOM_OPTIONS)[number];

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  headache: "頭痛",
  fever: "発熱",
  fatigue: "倦怠感",
  nausea: "吐き気",
  stomachache: "腹痛",
  dizziness: "めまい",
  cough: "咳",
  runny_nose: "鼻水",
  joint_pain: "関節痛",
  insomnia: "不眠",
  menstrual_pain: "生理痛",
  vomiting: "嘔吐",
  diarrhea: "下痢",
  bloody_urine: "血尿",
  bleeding: "出血",
  eye_discharge: "目ヤニ",
  loss_of_appetite: "食欲不振",
  lethargy: "元気がない",
};

const CONDITION_LABELS: Record<ConditionLevel, string> = {
  1: "とても悪い",
  2: "悪い",
  3: "普通",
  4: "良い",
  5: "とても良い",
};

const CONDITION_COLORS: Record<ConditionLevel, string> = {
  1: "text-red-600",
  2: "text-orange-500",
  3: "text-yellow-500",
  4: "text-green-500",
  5: "text-green-600",
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function getConditionLabel(level: ConditionLevel): string {
  return CONDITION_LABELS[level];
}

export function getConditionColor(level: ConditionLevel): string {
  return CONDITION_COLORS[level];
}

export function getSymptomLabel(symptom: SymptomType): string {
  return SYMPTOM_LABELS[symptom];
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayOfWeekLabel(date: Date): string {
  return DAY_LABELS[date.getDay()];
}

// クライアント側で扱う体調記録（日付を Date 化し、メンバー名を付与）
export interface HealthLogView {
  id: string;
  memberId: string;
  memberName: string;
  conditionLevel: ConditionLevel;
  symptoms: SymptomType[];
  notes?: string;
  recordedAt: Date;
}

export interface DailyHealthLogGroup {
  date: string;
  logs: HealthLogView[];
}

export interface DailyAverage {
  date: string;
  dayLabel: string;
  average: number | null;
}

export interface SymptomFrequency {
  symptom: SymptomType;
  count: number;
}

/** 日付ごとにグループ化（新しい順） */
export function groupByDate(logs: HealthLogView[]): DailyHealthLogGroup[] {
  const groups = new Map<string, HealthLogView[]>();
  for (const log of logs) {
    const dateStr = toDateKey(log.recordedAt);
    if (!groups.has(dateStr)) groups.set(dateStr, []);
    groups.get(dateStr)!.push(log);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dateLogs]) => ({
      date,
      logs: dateLogs.sort(
        (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime(),
      ),
    }));
}

/** 日付を日本語形式でフォーマット */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return `${date.getMonth() + 1}月${date.getDate()}日(${getDayOfWeekLabel(date)})`;
}

/** 日ごとの平均体調レベルを算出（古い→新しい順） */
export function getDailyAverages(
  logs: HealthLogView[],
  days: number,
  today: Date,
): DailyAverage[] {
  const result: DailyAverage[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = toDateKey(d);
    const dayLabel = getDayOfWeekLabel(d);
    const dayLogs = logs.filter((log) => toDateKey(log.recordedAt) === dateKey);
    if (dayLogs.length === 0) {
      result.push({ date: dateKey, dayLabel, average: null });
    } else {
      const sum = dayLogs.reduce((acc, log) => acc + log.conditionLevel, 0);
      result.push({
        date: dateKey,
        dayLabel,
        average: Math.round(sum / dayLogs.length),
      });
    }
  }
  return result;
}

/** 最も多い症状を取得 */
export function getMostFrequentSymptoms(
  logs: HealthLogView[],
  limit = 3,
): SymptomFrequency[] {
  const counts = new Map<SymptomType, number>();
  for (const log of logs) {
    for (const symptom of log.symptoms) {
      counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// 体温記録ロジック
// ---------------------------------------------------------------------------

export type TemperatureCategory =
  | "hypothermia"
  | "normal"
  | "low_fever"
  | "fever"
  | "high_fever";

const TEMP_CATEGORY_LABELS: Record<TemperatureCategory, string> = {
  hypothermia: "低体温",
  normal: "平熱",
  low_fever: "微熱",
  fever: "発熱",
  high_fever: "高熱",
};

const TEMP_CATEGORY_COLORS: Record<TemperatureCategory, string> = {
  hypothermia: "text-blue-600",
  normal: "text-green-600",
  low_fever: "text-yellow-600",
  fever: "text-orange-600",
  high_fever: "text-red-600",
};

export function classifyTemperature(temperature: number): TemperatureCategory {
  if (temperature < 35.0) return "hypothermia";
  if (temperature < 37.5) return "normal";
  if (temperature < 38.0) return "low_fever";
  if (temperature < 39.0) return "fever";
  return "high_fever";
}

export function getTemperatureCategoryLabel(
  category: TemperatureCategory,
): string {
  return TEMP_CATEGORY_LABELS[category];
}

export function getTemperatureCategoryColor(
  category: TemperatureCategory,
): string {
  return TEMP_CATEGORY_COLORS[category];
}

export interface TemperatureRecordView {
  id: string;
  memberId: string;
  memberName?: string;
  temperature: number;
  measuredAt: Date;
  notes?: string;
}

export interface BodyMeasurementView {
  id: string;
  memberId: string;
  memberName?: string;
  weight?: number;
  height?: number;
  recordedAt: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// データ取得フック（React Query）
// ---------------------------------------------------------------------------

function memberNameOf(members: Member[] | undefined, memberId: string): string {
  return members?.find((m) => m.id === memberId)?.name ?? "";
}

export function useMembersQuery() {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
  });
}

export interface CreateHealthLogInput {
  memberId: string;
  conditionLevel: number;
  symptoms?: string[];
  notes?: string;
}

export function useHealthLogs(members: Member[] | undefined) {
  const { items, isLoading, create, remove } = useResource<HealthLog>({
    queryKey: queryKeys.healthLogs.all,
    listPath: "/health-logs",
    basePath: "/health-logs",
  });

  const logs: HealthLogView[] = items.map((h) => ({
    id: h.id,
    memberId: h.memberId,
    memberName: memberNameOf(members, h.memberId),
    conditionLevel: (h.conditionLevel as ConditionLevel) ?? 3,
    symptoms: (h.symptoms ?? []) as SymptomType[],
    notes: h.notes ?? undefined,
    recordedAt: new Date(h.recordedAt),
  }));

  const groups = groupByDate(logs);

  return {
    logs,
    groups,
    isLoading,
    createLog: (input: CreateHealthLogInput) =>
      create.mutateAsync({
        memberId: input.memberId,
        conditionLevel: input.conditionLevel,
        symptoms: input.symptoms,
        notes: input.notes,
        recordedAt: new Date().toISOString(),
      }),
    deleteLog: (id: string) => remove.mutateAsync(id),
  };
}

export interface CreateTemperatureInput {
  memberId: string;
  temperature: number;
  measuredAt: string;
  notes?: string;
}

export function useTemperatureRecords(members: Member[] | undefined) {
  const { items, isLoading, create, remove } = useResource<TemperatureRecord>({
    queryKey: queryKeys.temperatureRecords.all,
    listPath: "/temperature-records",
    basePath: "/temperature-records",
  });

  const records: TemperatureRecordView[] = items
    .map((r) => ({
      id: r.id,
      memberId: r.memberId,
      memberName: memberNameOf(members, r.memberId) || undefined,
      temperature: r.temperature,
      measuredAt: new Date(r.measuredAt),
      notes: r.notes ?? undefined,
    }))
    .sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());

  return {
    records,
    isLoading,
    createRecord: (input: CreateTemperatureInput) =>
      create.mutateAsync({
        memberId: input.memberId,
        temperature: input.temperature,
        measuredAt: input.measuredAt,
        notes: input.notes,
      }),
    deleteRecord: (id: string) => remove.mutateAsync(id),
  };
}

export interface CreateBodyMeasurementInput {
  memberId: string;
  weight?: number;
  height?: number;
  recordedAt: string;
  notes?: string;
}

export interface UpdateBodyMeasurementInput {
  weight?: number | null;
  height?: number | null;
  notes?: string | null;
}

export function useBodyMeasurements(members: Member[] | undefined) {
  const { items, isLoading, create, update, remove } = useResource<
    BodyMeasurement,
    unknown,
    UpdateBodyMeasurementInput
  >({
    queryKey: queryKeys.bodyMeasurements.all,
    listPath: "/body-measurements",
    basePath: "/body-measurements",
  });

  const measurements: BodyMeasurementView[] = items
    .map((m) => ({
      id: m.id,
      memberId: m.memberId,
      memberName: memberNameOf(members, m.memberId) || undefined,
      weight: m.weight ?? undefined,
      height: m.height ?? undefined,
      recordedAt: m.recordedAt,
      notes: m.notes ?? undefined,
    }))
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );

  return {
    measurements,
    isLoading,
    createMeasurement: (input: CreateBodyMeasurementInput) =>
      create.mutateAsync({
        memberId: input.memberId,
        weight: input.weight,
        height: input.height,
        recordedAt: new Date(input.recordedAt).toISOString(),
        notes: input.notes,
      }),
    updateMeasurement: async (
      id: string,
      input: UpdateBodyMeasurementInput,
    ): Promise<void> => {
      await update.mutateAsync({ id, input });
    },
    deleteMeasurement: (id: string) => remove.mutateAsync(id),
  };
}
