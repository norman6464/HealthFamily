// 体温記録ドメインロジック（旧 TemperatureRecordEntity から移植）

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
