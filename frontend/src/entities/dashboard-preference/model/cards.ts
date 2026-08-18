// ダッシュボードで制御可能なカード(greeting は常時表示のため対象外)
export const DASHBOARD_CARD_KEYS = [
  "weeklySummary",
  "missedDoses",
  "todaySchedule",
  "stockAlerts",
  "adherence",
  "upcomingAppointments",
] as const;

export type DashboardCardKey = (typeof DASHBOARD_CARD_KEYS)[number];

// 並び替え対象となる下部カード
export const ORDERABLE_CARD_KEYS: readonly DashboardCardKey[] = [
  "stockAlerts",
  "adherence",
  "upcomingAppointments",
];
