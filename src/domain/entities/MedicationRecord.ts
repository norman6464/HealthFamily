/**
 * 服薬記録エンティティ
 */

import { AdherenceStatsEntity } from './AdherenceStats';
import { DateRangeHelper } from './DateRange';
import { ScheduleEntity } from './Schedule';

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
      const dateStr = DateRangeHelper.toDateKey(record.takenAt);
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
    return `${date.getMonth() + 1}月${date.getDate()}日(${DateRangeHelper.getDayOfWeekLabel(date)})`;
  }

  /**
   * 時刻を HH:mm 形式でフォーマット
   */
  static formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * メンバーIDでレコードをフィルタリング
   * nullの場合は全レコードを返す
   */
  static filterByMember(records: MedicationRecord[], memberId: string | null): MedicationRecord[] {
    if (memberId === null) return records;
    return records.filter((r) => r.memberId === memberId);
  }

  /**
   * グループ内のレコードをメンバーIDでフィルタリング
   * フィルタ後に空になったグループは除外する
   */
  static filterGroupsByMember(groups: DailyRecordGroup[], memberId: string | null): DailyRecordGroup[] {
    if (memberId === null) return groups;
    return groups
      .map((g) => ({
        ...g,
        records: g.records.filter((r) => r.memberId === memberId),
      }))
      .filter((g) => g.records.length > 0);
  }

  /**
   * 記録にメモが含まれているか判定
   */
  static hasNotes(record: MedicationRecord): boolean {
    return !!record.notes && record.notes.trim().length > 0;
  }

  /**
   * メモ付き記録のみをフィルタリング
   */
  static filterWithNotes(records: MedicationRecord[]): MedicationRecord[] {
    return records.filter((r) => MedicationRecordEntity.hasNotes(r));
  }

  /**
   * グループ内のメモ付き記録のみを残し、空グループは除外
   */
  static filterGroupsWithNotes(groups: DailyRecordGroup[]): DailyRecordGroup[] {
    return groups
      .map((g) => ({
        ...g,
        records: g.records.filter((r) => MedicationRecordEntity.hasNotes(r)),
      }))
      .filter((g) => g.records.length > 0);
  }

  /**
   * 日別の服薬回数を集計
   */
  static getDailyRecordCounts(records: MedicationRecord[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const record of records) {
      const key = DateRangeHelper.toDateKey(new Date(record.takenAt));
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  /**
   * 薬別の服薬回数をランキング形式で返す(多い順)
   */
  static getMedicationFrequency(records: MedicationRecord[]): { medicationName: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const record of records) {
      counts[record.medicationName] = (counts[record.medicationName] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([medicationName, count]) => ({ medicationName, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 総服薬回数を返す
   */
  static getTotalRecordCount(records: MedicationRecord[]): number {
    return records.length;
  }

  /**
   * 平均服薬時刻をHH:mm形式で返す
   */
  static getAverageTimeTaken(records: MedicationRecord[]): string | null {
    if (records.length === 0) return null;
    const totalMinutes = records.reduce((sum, r) => {
      const d = new Date(r.takenAt);
      return sum + d.getHours() * 60 + d.getMinutes();
    }, 0);
    const avg = Math.round(totalMinutes / records.length);
    const h = Math.floor(avg / 60).toString().padStart(2, '0');
    const m = (avg % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * 時間帯別の服薬件数分布を返す
   */
  static getTimePeriodDistribution(records: MedicationRecord[]): {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  } {
    const dist = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const r of records) {
      const time = MedicationRecordEntity.formatTime(new Date(r.takenAt));
      const period = ScheduleEntity.getTimePeriod(time);
      dist[period]++;
    }
    return dist;
  }

  /**
   * 最も服薬が多い時間(時)を返す
   */
  static getMostActiveHour(records: MedicationRecord[]): number | null {
    if (records.length === 0) return null;
    const counts: Record<number, number> = {};
    for (const r of records) {
      const hour = new Date(r.takenAt).getHours();
      counts[hour] = (counts[hour] || 0) + 1;
    }
    let maxHour = 0;
    let maxCount = 0;
    for (const [hour, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxHour = Number(hour);
        maxCount = count;
      }
    }
    return maxHour;
  }

  /**
   * 曜日別の記録数を集計する
   * 返り値: [日, 月, 火, 水, 木, 金, 土]
   */
  static getRecordsByDayOfWeek(records: MedicationRecord[]): number[] {
    const counts = new Array(7).fill(0);
    for (const record of records) {
      counts[new Date(record.takenAt).getDay()]++;
    }
    return counts;
  }

  /**
   * 最も記録が多い薬を返す
   */
  static getMostRecordedMedication(records: MedicationRecord[]): { medicationName: string; count: number } | null {
    if (records.length === 0) return null;
    const frequency = MedicationRecordEntity.getMedicationFrequency(records);
    return frequency[0];
  }

  /**
   * 記録間の空白期間（閾値以上）を検出する
   */
  static getRecordGaps(
    records: MedicationRecord[],
    thresholdDays: number = 3,
  ): { from: string; to: string; days: number }[] {
    if (records.length <= 1) return [];
    const sorted = [...records].sort(
      (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
    );
    const uniqueDates = [...new Set(sorted.map((r) => DateRangeHelper.toDateKey(new Date(r.takenAt))))];
    const gaps: { from: string; to: string; days: number }[] = [];
    for (let i = 1; i < uniqueDates.length; i++) {
      const from = new Date(uniqueDates[i - 1] + 'T00:00:00');
      const to = new Date(uniqueDates[i] + 'T00:00:00');
      const days = DateRangeHelper.diffDays(from, to);
      if (days >= thresholdDays) {
        gaps.push({ from: uniqueDates[i - 1], to: uniqueDates[i], days });
      }
    }
    return gaps;
  }

  /**
   * 現在の連続記録日数を返す（今日から遡って連続する日数）
   */
  static getCurrentStreak(records: MedicationRecord[], today: Date): number {
    if (records.length === 0) return 0;
    const uniqueDates = [
      ...new Set(records.map((r) => DateRangeHelper.toDateKey(new Date(r.takenAt)))),
    ].sort((a, b) => b.localeCompare(a));
    const todayKey = DateRangeHelper.toDateKey(today);
    if (uniqueDates[0] !== todayKey) return 0;
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
      const curr = new Date(uniqueDates[i] + 'T00:00:00');
      if (DateRangeHelper.diffDays(curr, prev) === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * 最長の連続記録日数を返す
   */
  static getLongestStreak(records: MedicationRecord[]): number {
    return AdherenceStatsEntity.calculateLongestStreak(
      records.map((r) => new Date(r.takenAt)),
    );
  }

  /**
   * 連続日数に応じた励ましメッセージを返す
   */
  static getStreakMessage(days: number): string {
    if (days === 0) return '今日から始めましょう';
    if (days === 1) return '記録を始めました';
    if (days < 7) return `${days}日連続です`;
    if (days < 14) return '1週間継続中です';
    if (days < 30) return '順調に継続しています';
    return '素晴らしい継続力です';
  }
}
