import type { TodaySchedule } from "@/shared/api";

// 「今日の予定」1件の状態判定。予定時刻との前後関係だけで決まる。

export type ScheduleStatus = "pending" | "completed" | "overdue";
export type OverdueLevel = "none" | "warning" | "danger";

const PROXIMITY_SOON_MINUTES = 30;
const PROXIMITY_NEAR_MINUTES = 60;

function getScheduledDateTime(scheduledTime: string, baseTime: Date): Date {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const dt = new Date(baseTime);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

export function getScheduleStatus(scheduledTime: string, currentTime: Date, isCompleted: boolean): ScheduleStatus {
  if (isCompleted) return "completed";
  const scheduledDateTime = getScheduledDateTime(scheduledTime, currentTime);
  if (currentTime > scheduledDateTime) return "overdue";
  return "pending";
}

export function getOverdueLevel(scheduledTime: string, currentTime: Date, isCompleted: boolean): OverdueLevel {
  if (isCompleted) return "none";
  const scheduledDateTime = getScheduledDateTime(scheduledTime, currentTime);
  const diffMs = currentTime.getTime() - scheduledDateTime.getTime();
  if (diffMs <= 0) return "none";
  const diffMinutes = diffMs / (1000 * 60);
  if (diffMinutes >= PROXIMITY_NEAR_MINUTES) return "danger";
  if (diffMinutes >= PROXIMITY_SOON_MINUTES) return "warning";
  return "none";
}

export function getOverdueMinutes(scheduledTime: string, currentTime: Date): number {
  const scheduledDateTime = getScheduledDateTime(scheduledTime, currentTime);
  const diffMs = currentTime.getTime() - scheduledDateTime.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60));
}

export function getOverdueLevelStyle(level: OverdueLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case "danger":
      return { bg: "bg-red-50", text: "text-red-600", border: "border-red-300" };
    case "warning":
      return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-300" };
    default:
      return { bg: "", text: "", border: "" };
  }
}

export interface TodayScheduleViewModel {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  userId: string;
  memberId: string;
  memberName: string;
  memberType: "human" | "pet";
  scheduledTime: string;
  medicationDisplayOrder: number;
  status: ScheduleStatus;
  isEnabled: boolean;
  reminderMinutesBefore: number;
}

/**
 * 今日の予定を表示順 (時刻 → メンバー名 → 薬の表示順) に整えた ViewModel へ変換する。
 */
export function toTodayScheduleViewModels(
  items: TodaySchedule[],
  now: Date,
): TodayScheduleViewModel[] {
  const result = items.map((item): TodayScheduleViewModel => ({
    scheduleId: item.id,
    medicationId: item.medicationId,
    medicationName: item.medicationName,
    userId: item.userId,
    memberId: item.memberId,
    memberName: item.memberName,
    memberType: item.memberType === "pet" ? "pet" : "human",
    scheduledTime: item.scheduledTime,
    medicationDisplayOrder: item.medicationDisplayOrder ?? 0,
    status: getScheduleStatus(item.scheduledTime, now, item.isCompleted),
    isEnabled: item.isEnabled,
    reminderMinutesBefore: item.reminderMinutesBefore ?? 10,
  }));
  result.sort((a, b) => {
    const timeCompare = a.scheduledTime.localeCompare(b.scheduledTime);
    if (timeCompare !== 0) return timeCompare;
    const memberCompare = a.memberName.localeCompare(b.memberName);
    if (memberCompare !== 0) return memberCompare;
    return a.medicationDisplayOrder - b.medicationDisplayOrder;
  });
  return result;
}
