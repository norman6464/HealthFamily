import type { Appointment } from "@/shared/api";

export type AppointmentFilter = "upcoming" | "past";

/** 通院予約フォームの入力値。作成 / 更新の両 feature が参照するため entities に置く。 */
export interface AppointmentFormData {
  memberId: string;
  hospitalId?: string;
  appointmentDate: string;
  type?: string;
  notes?: string;
}

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  checkup: "定期検診",
  treatment: "治療",
  vaccination: "予防接種",
  surgery: "手術",
  consultation: "相談",
  medication_pickup: "お薬",
  examination: "検査",
  flea_tick: "ノミ・ダニ薬",
  heartworm: "フィラリア",
  therapeutic_diet: "療養食",
  grooming: "トリミング",
  other: "その他",
};

const DAY_OF_WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getAppointmentDate(appointment: Appointment): Date {
  const d = new Date(appointment.appointmentDate);
  if (!Number.isNaN(d.getTime())) return d;
  const fallback = new Date(appointment.createdAt);
  return !Number.isNaN(fallback.getTime()) ? fallback : new Date(0);
}

export function isToday(appointment: Appointment): boolean {
  return toStartOfDay(new Date()).getTime() === toStartOfDay(getAppointmentDate(appointment)).getTime();
}

export function isPast(appointment: Appointment): boolean {
  return toStartOfDay(getAppointmentDate(appointment)).getTime() < toStartOfDay(new Date()).getTime();
}

export function daysUntil(appointment: Appointment): number {
  const diffMs = toStartOfDay(getAppointmentDate(appointment)).getTime() - toStartOfDay(new Date()).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDate(appointment: Appointment): string {
  const d = getAppointmentDate(appointment);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${DAY_OF_WEEK_LABELS[d.getDay()]})`;
}

export function getTypeLabel(type: string | null): string {
  if (!type) return "";
  return APPOINTMENT_TYPE_LABELS[type] || type;
}

export function getAppointmentCounts(appointments: Appointment[]): { upcoming: number; past: number } {
  let upcoming = 0;
  let past = 0;
  for (const a of appointments) {
    if (isPast(a)) past++;
    else upcoming++;
  }
  return { upcoming, past };
}
