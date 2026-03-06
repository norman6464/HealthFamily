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
  private static readonly MORNING_START_HOUR = 5;
  private static readonly AFTERNOON_START_HOUR = 12;
  private static readonly EVENING_START_HOUR = 17;
  private static readonly NIGHT_START_HOUR = 21;
  private static readonly PATTERN_DOMINANCE_THRESHOLD = 0.5;
  private static readonly ADHERENCE_EXCELLENT_THRESHOLD = 90;
  private static readonly ADHERENCE_GOOD_THRESHOLD = 70;
  private static readonly ADHERENCE_WARNING_THRESHOLD = 50;

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

  /**
   * 日別の服薬サマリーテキストを生成する
   */
  static getDailySummaryText(completed: number, total: number): string {
    if (total === 0) return '今日の服薬はありません';
    if (completed === total) return `全${total}件の服薬が完了しました`;
    return `${total}件中${completed}件の服薬が完了しています`;
  }

  /**
   * 過去7日間の記録数を算出する
   */
  static getWeeklyRecordCount(records: MedicationRecord[], today: Date): number {
    const weekAgo = DateRangeHelper.daysAgo(7, today);
    return records.filter((r) => {
      const takenDate = DateRangeHelper.toStartOfDay(new Date(r.takenAt));
      return takenDate.getTime() >= weekAgo.getTime();
    }).length;
  }

  /**
   * 記録の増減傾向ラベルを返す（差が1以内は横ばい）
   */
  static getRecordTrendLabel(currentCount: number, previousCount: number): string {
    const diff = currentCount - previousCount;
    if (Math.abs(diff) <= 1) return '横ばい';
    return diff > 0 ? '増加傾向' : '減少傾向';
  }

  /**
   * 2つの服薬時刻間の時間差（分）を算出する
   */
  static getTimeBetweenDoses(time1: Date, time2: Date): number {
    return Math.abs(time1.getTime() - time2.getTime()) / (1000 * 60);
  }

  /**
   * 最小服用間隔を満たしているかチェックする
   */
  static isMinIntervalMet(actualMinutes: number, minIntervalMinutes: number): boolean {
    return actualMinutes >= minIntervalMinutes;
  }

  /**
   * 間隔が短い場合の警告メッセージを返す
   */
  static getIntervalWarning(actualMinutes: number, minIntervalMinutes: number): string | null {
    if (actualMinutes >= minIntervalMinutes) return null;
    const hours = Math.floor(minIntervalMinutes / 60);
    const mins = minIntervalMinutes % 60;
    const label = hours > 0 ? (mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`) : `${mins}分`;
    return `前回の服薬から${label}以上空けてください`;
  }

  /**
   * 複数記録のバッチサマリーテキストを返す
   */
  static getBatchSummary(completed: number, total: number): string {
    if (total === 0) return '記録はありません';
    if (completed === total) return `全${total}件の服薬が完了しました`;
    return `${total}件中${completed}件が完了しています`;
  }

  /**
   * メンバー別の記録件数を集計する
   */
  static getMemberRecordCounts(records: MedicationRecord[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.memberName] = (counts[r.memberName] || 0) + 1;
    }
    return counts;
  }

  /**
   * 完了率に応じたメッセージを返す
   */
  static getCompletionRateMessage(rate: number): string {
    if (rate >= 100) return '完璧です';
    if (rate >= 80) return '良い調子です';
    if (rate >= 50) return 'もう少しで達成です';
    return '少しずつ頑張りましょう';
  }

  /**
   * 最後の服薬からの経過時間を日本語文字列で返す
   */
  static getTimeSinceLastDose(records: MedicationRecord[], now: Date): string | null {
    if (records.length === 0) return null;
    const latest = records.reduce((a, b) =>
      new Date(a.takenAt).getTime() > new Date(b.takenAt).getTime() ? a : b,
    );
    const diffMs = now.getTime() - new Date(latest.takenAt).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  }

  /**
   * 服薬記録間隔の統計(平均・最小・最大)を算出
   */
  static getDoseIntervalStats(
    records: MedicationRecord[],
  ): { averageMinutes: number; minMinutes: number; maxMinutes: number } | null {
    if (records.length < 2) return null;
    const sorted = [...records].sort(
      (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
    );
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (new Date(sorted[i].takenAt).getTime() - new Date(sorted[i - 1].takenAt).getTime()) /
        (1000 * 60);
      intervals.push(diff);
    }
    const sum = intervals.reduce((a, b) => a + b, 0);
    return {
      averageMinutes: Math.round(sum / intervals.length),
      minMinutes: Math.min(...intervals),
      maxMinutes: Math.max(...intervals),
    };
  }

  /**
   * 平均間隔に基づく次回服薬予定時刻を推定
   */
  static getNextDoseEstimate(records: MedicationRecord[]): Date | null {
    const stats = MedicationRecordEntity.getDoseIntervalStats(records);
    if (!stats) return null;
    const sorted = [...records].sort(
      (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime(),
    );
    const lastTime = new Date(sorted[sorted.length - 1].takenAt).getTime();
    return new Date(lastTime + stats.averageMinutes * 60 * 1000);
  }

  /**
   * 時間帯別（0-23時）の服薬回数分布を返す
   */
  static getHourlyDistribution(records: { takenAt: Date }[]): number[] {
    const dist = new Array(24).fill(0);
    for (const r of records) {
      dist[new Date(r.takenAt).getHours()]++;
    }
    return dist;
  }

  /**
   * 最終記録日からの未服薬日数を返す（記録なしは-1）
   */
  static getConsecutiveMissedDays(recordDateKeys: string[], todayKey: string): number {
    if (recordDateKeys.length === 0) return -1;
    const sorted = [...recordDateKeys].sort();
    const lastDate = sorted[sorted.length - 1];
    if (lastDate >= todayKey) return 0;
    const last = new Date(lastDate);
    const today = new Date(todayKey);
    const diffMs = today.getTime() - last.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * 服薬率に応じたコンプライアンスレベルを判定する
   */
  static getComplianceLevel(rate: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (rate >= 90) return 'excellent';
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'fair';
    return 'poor';
  }

  /**
   * コンプライアンスレベルの日本語ラベルを返す
   */
  static getComplianceLevelLabel(level: 'excellent' | 'good' | 'fair' | 'poor'): string {
    const labels: Record<string, string> = {
      excellent: '優秀',
      good: '良好',
      fair: '普通',
      poor: '要改善',
    };
    return labels[level];
  }

  /**
   * 予定時刻と実際の服薬時刻の差を分単位で算出する
   */
  static getTimingGaps(records: { scheduledTime: string; takenAt: Date }[]): number[] {
    return records.map((r) => {
      const [hours, minutes] = r.scheduledTime.split(':').map(Number);
      const scheduled = hours * 60 + minutes;
      const taken = r.takenAt.getHours() * 60 + r.takenAt.getMinutes();
      return taken - scheduled;
    });
  }

  /**
   * 時間差の平均を算出する(絶対値の平均)
   */
  static getAverageTimingGap(gaps: number[]): number {
    if (gaps.length === 0) return 0;
    const totalAbs = gaps.reduce((sum, g) => sum + Math.abs(g), 0);
    return Math.round(totalAbs / gaps.length);
  }

  /**
   * 平均時間差に応じた正確性ラベルを返す
   */
  static getTimingAccuracyLabel(averageGapMinutes: number): string {
    if (averageGapMinutes <= 5) return '正確';
    if (averageGapMinutes <= 15) return 'ほぼ正確';
    if (averageGapMinutes <= 30) return 'やや遅れ';
    return '大幅な遅れ';
  }

  /**
   * 日別の服薬遵守スコアを算出する(0-100)
   */
  static getDailyComplianceScore(taken: number, scheduled: number): number {
    if (scheduled <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((taken / scheduled) * 100)));
  }

  /**
   * 遵守スコアに応じたラベルを返す
   */
  static getComplianceScoreLabel(score: number): string {
    if (score >= 100) return '完璧';
    if (score >= 90) return '優秀';
    if (score >= 70) return '良好';
    if (score >= 50) return '要改善';
    return '不十分';
  }

  /**
   * 時間帯別の服薬回数を集計する
   */
  static getMedicationPatternByTimeOfDay(times: string[]): {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  } {
    const result = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const time of times) {
      const hour = parseInt(time.split(':')[0], 10);
      if (hour >= MedicationRecordEntity.MORNING_START_HOUR && hour < MedicationRecordEntity.AFTERNOON_START_HOUR) {
        result.morning++;
      } else if (hour >= MedicationRecordEntity.AFTERNOON_START_HOUR && hour < MedicationRecordEntity.EVENING_START_HOUR) {
        result.afternoon++;
      } else if (hour >= MedicationRecordEntity.EVENING_START_HOUR && hour < MedicationRecordEntity.NIGHT_START_HOUR) {
        result.evening++;
      } else {
        result.night++;
      }
    }
    return result;
  }

  /**
   * 服薬パターンのラベルを返す
   */
  static getMedicationPatternLabel(pattern: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  }): string {
    const total = pattern.morning + pattern.afternoon + pattern.evening + pattern.night;
    if (total === 0) return '均等';
    if (pattern.morning / total > MedicationRecordEntity.PATTERN_DOMINANCE_THRESHOLD) return '朝型';
    if (pattern.night / total > MedicationRecordEntity.PATTERN_DOMINANCE_THRESHOLD) return '夜型';
    if (pattern.afternoon / total > MedicationRecordEntity.PATTERN_DOMINANCE_THRESHOLD) return '午後型';
    if (pattern.evening / total > MedicationRecordEntity.PATTERN_DOMINANCE_THRESHOLD) return '夕方型';
    return '均等';
  }

  /**
   * 指定日の薬別服薬回数を集計する
   */
  static getDailyDosageCount(
    records: { medicationName: string; date: string }[],
    dateKey: string,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.date === dateKey) {
        counts[r.medicationName] = (counts[r.medicationName] || 0) + 1;
      }
    }
    return counts;
  }

  /**
   * 服薬回数に応じたカテゴリラベルを返す
   */
  static getDosageCategoryLabel(count: number): string {
    if (count === 0) return 'なし';
    if (count <= 2) return '少なめ';
    if (count <= 4) return '標準';
    if (count <= 6) return '多め';
    return '非常に多い';
  }

  private static readonly WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  /**
   * 曜日別の服薬記録パターンを算出する
   */
  static getWeekdayAdherencePattern(
    records: { dayOfWeek: number }[],
    _totalDays: number,
  ): { label: string; count: number }[] {
    const counts = new Array(7).fill(0);
    for (const record of records) {
      if (record.dayOfWeek >= 0 && record.dayOfWeek <= 6) {
        counts[record.dayOfWeek]++;
      }
    }
    return counts.map((count, i) => ({
      label: MedicationRecordEntity.WEEKDAY_LABELS[i],
      count,
    }));
  }

  /**
   * 曜日別パターンから平日/休日/均等のラベルを返す
   */
  static getWeekdayPatternLabel(pattern: { label: string; count: number }[]): string {
    if (pattern.length < 7) return '均等';
    const weekdayTotal = pattern[1].count + pattern[2].count + pattern[3].count + pattern[4].count + pattern[5].count;
    const weekendTotal = pattern[0].count + pattern[6].count;
    const total = weekdayTotal + weekendTotal;
    if (total === 0) return '均等';
    const weekdayRatio = weekdayTotal / total;
    if (weekdayRatio > 0.8) return '平日中心';
    if (weekdayRatio < 0.3) return '休日中心';
    return '均等';
  }

  /**
   * メンバー別の遵守率(0-100)を算出する
   */
  static getMedicationAdherenceByMember(
    records: { memberId: string; completed: boolean }[],
  ): Record<string, number> {
    if (records.length === 0) return {};
    const memberData: Record<string, { total: number; completed: number }> = {};
    for (const record of records) {
      if (!memberData[record.memberId]) {
        memberData[record.memberId] = { total: 0, completed: 0 };
      }
      memberData[record.memberId].total++;
      if (record.completed) memberData[record.memberId].completed++;
    }
    const result: Record<string, number> = {};
    for (const [memberId, data] of Object.entries(memberData)) {
      result[memberId] = Math.round((data.completed / data.total) * 100);
    }
    return result;
  }

  /**
   * メンバー別遵守率に応じたラベルを返す
   */
  static getMemberAdherenceLabel(rate: number): string {
    if (rate >= MedicationRecordEntity.ADHERENCE_EXCELLENT_THRESHOLD) return '優秀';
    if (rate >= MedicationRecordEntity.ADHERENCE_GOOD_THRESHOLD) return '良好';
    if (rate >= MedicationRecordEntity.ADHERENCE_WARNING_THRESHOLD) return '要注意';
    return '要改善';
  }

  /**
   * 時間差(分)配列から服薬時間の一貫性スコア(0-100)を算出する
   * 標準偏差が小さいほど高スコア
   */
  static getDoseTimingConsistency(gaps: number[]): number {
    if (gaps.length === 0) return 0;
    if (gaps.length === 1) return 100;
    const absGaps = gaps.map(Math.abs);
    const avg = absGaps.reduce((a, b) => a + b, 0) / absGaps.length;
    const variance = absGaps.reduce((sum, v) => sum + (v - avg) ** 2, 0) / absGaps.length;
    const stdDev = Math.sqrt(variance);
    const maxStdDev = 60;
    return Math.max(0, Math.min(100, Math.round(100 - (stdDev / maxStdDev) * 100)));
  }

  /**
   * 服薬時間一貫性スコアに応じたラベルを返す
   */
  static getDoseTimingLabel(score: number): string {
    if (score >= 70) return '安定';
    if (score >= 40) return 'やや不安定';
    return '不安定';
  }
}
