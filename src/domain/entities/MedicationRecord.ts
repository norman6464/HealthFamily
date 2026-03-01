/**
 * 服薬記録エンティティ
 */

export interface MedicationRecord {
  readonly id: string;
  readonly memberId: string;
  readonly memberName: string;
  readonly medicationId: string;
  readonly medicationName: string;
  readonly userId: string;
  readonly scheduleId?: string;
  readonly takenAt: Date;
  readonly notes?: string;
  readonly dosageAmount?: string;
}

export interface DailyRecordGroup {
  date: string;
  records: MedicationRecord[];
}

/**
 * 服薬記録のビジネスロジック
 */
export class MedicationRecordEntity {
  /**
   * 記録を日付ごとにグループ化（新しい順）
   */
  static groupByDate(records: MedicationRecord[]): DailyRecordGroup[] {
    const groups = new Map<string, MedicationRecord[]>();

    for (const record of records) {
      const d = record.takenAt;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups.has(dateStr)) {
        groups.set(dateStr, []);
      }
      groups.get(dateStr)!.push(record);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, recs]) => ({ date, records: recs }));
  }

  /**
   * 日付を日本語形式でフォーマット（例: 6月15日(土)）
   */
  static formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日(${days[date.getDay()]})`;
  }

  /**
   * 時刻を HH:mm 形式でフォーマット
   */
  static formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
