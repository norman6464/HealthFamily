/**
 * React Query キーの一元管理ファクトリ。
 *
 * 重要: キャッシュと無効化(invalidateQueries)はキー配列の「要素・順序の完全一致」と
 * 「プレフィックス一致」に依存している。
 * 例: invalidateQueries({ queryKey: queryKeys.records.all }) は ["records"] となり、
 *     ["records", "window", 40] をプレフィックス一致で無効化する。
 *
 * したがって、各メンバーは既存のリテラル配列とバイト単位で同一の配列を返す必要がある。
 * 変更時はキーの要素・順序を絶対に変えないこと。
 */
export const queryKeys = {
  members: {
    all: ["members"] as const,
    // memberId は useParams() 由来で string | undefined になり得る。
    // 既存リテラル ["members", memberId] の挙動を完全一致で維持するため undefined も許容する。
    detail: (memberId: string | undefined) => ["members", memberId] as const,
    medications: (memberId: string | undefined) =>
      ["members", memberId, "medications"] as const,
  },
  medications: {
    all: ["medications"] as const,
    byMember: (memberId: string) => ["medications", memberId] as const,
  },
  schedules: {
    all: ["schedules"] as const,
    today: ["schedules", "today"] as const,
  },
  records: {
    all: ["records"] as const,
    window: (limit: number) => ["records", "window", limit] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (year: number, memberId: string | null) =>
      ["expenses", year, memberId] as const,
    summary: (year: number) => ["expenses", "summary", year] as const,
  },
  budget: {
    all: ["budget"] as const,
    alert: ["budget", "alert"] as const,
  },
  dashboardPreferences: {
    all: ["dashboard-preferences"] as const,
  },
  notificationSettings: {
    all: ["notification-settings"] as const,
  },
  users: {
    me: ["users", "me"] as const,
  },
  hospitals: {
    all: ["hospitals"] as const,
  },
  appointments: {
    all: ["appointments"] as const,
  },
  healthLogs: {
    all: ["health-logs"] as const,
  },
  vaccinations: {
    all: ["vaccinations"] as const,
  },
  examinations: {
    all: ["examinations"] as const,
  },
  insurances: {
    all: ["insurances"] as const,
  },
  allergies: {
    all: ["allergies"] as const,
  },
  bodyMeasurements: {
    all: ["body-measurements"] as const,
  },
  temperatureRecords: {
    all: ["temperature-records"] as const,
  },
  emergencyContacts: {
    all: ["emergency-contacts"] as const,
  },
  prescriptions: {
    all: ["prescriptions"] as const,
  },
} as const;
