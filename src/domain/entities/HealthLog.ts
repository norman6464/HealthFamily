/**
 * 体調記録エンティティ
 */

import { DateRangeHelper } from './DateRange';
import { MathHelper } from './MathHelper';

export const CONDITION_LEVELS = [1, 2, 3, 4, 5] as const;
export type ConditionLevel = (typeof CONDITION_LEVELS)[number];

export const SYMPTOM_OPTIONS = [
  'headache',
  'fever',
  'fatigue',
  'nausea',
  'stomachache',
  'dizziness',
  'cough',
  'runny_nose',
  'joint_pain',
  'insomnia',
  'menstrual_pain',
] as const;
export type SymptomType = (typeof SYMPTOM_OPTIONS)[number];

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  headache: '頭痛',
  fever: '発熱',
  fatigue: '倦怠感',
  nausea: '吐き気',
  stomachache: '腹痛',
  dizziness: 'めまい',
  cough: '咳',
  runny_nose: '鼻水',
  joint_pain: '関節痛',
  insomnia: '不眠',
  menstrual_pain: '生理痛',
};

export interface HealthLog {
  readonly id: string;
  readonly memberId: string;
  readonly memberName: string;
  readonly userId: string;
  readonly conditionLevel: ConditionLevel;
  readonly symptoms: SymptomType[];
  readonly notes?: string;
  readonly recordedAt: Date;
}

export interface DailyHealthLogGroup {
  date: string;
  logs: HealthLog[];
}

/**
 * 体調記録のビジネスロジック
 */
export class HealthLogEntity {
  private static readonly VOLATILITY_MAX_DIFF = 4;
  private static readonly VOLATILITY_STABLE_THRESHOLD = 30;
  private static readonly VOLATILITY_MODERATE_THRESHOLD = 60;
  private static readonly DIVERSITY_HIGH_THRESHOLD = 70;
  private static readonly MOMENTUM_THRESHOLD = 0.5;
  private static readonly DIVERSITY_MEDIUM_THRESHOLD = 30;
  private static readonly RECOVERY_GOOD_THRESHOLD = 70;
  private static readonly RECOVERY_MODERATE_THRESHOLD = 40;
  private static readonly VARIANCE_STABLE_THRESHOLD = 1;
  private static readonly VARIANCE_UNSTABLE_THRESHOLD = 3;
  private static readonly TEMP_HYPOTHERMIA = 35.0;
  private static readonly TEMP_LOW_FEVER = 37.5;
  private static readonly TEMP_FEVER = 38.0;
  private static readonly TEMP_HIGH_FEVER = 39.0;

  private static readonly CONDITION_LABELS: Record<ConditionLevel, string> = {
    1: 'とても悪い',
    2: '悪い',
    3: '普通',
    4: '良い',
    5: 'とても良い',
  };

  private static readonly CONDITION_COLORS: Record<ConditionLevel, string> = {
    1: 'text-red-600',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500',
    5: 'text-green-600',
  };

  private static readonly CONDITION_ICONS: Record<ConditionLevel, string> = {
    1: 'Frown',
    2: 'Meh',
    3: 'MinusCircle',
    4: 'Smile',
    5: 'Laugh',
  };

  /**
   * 体調レベルのラベルを取得
   */
  static getConditionLabel(level: ConditionLevel): string {
    return HealthLogEntity.CONDITION_LABELS[level];
  }

  /**
   * 体調レベルのカラークラスを取得
   */
  static getConditionColor(level: ConditionLevel): string {
    return HealthLogEntity.CONDITION_COLORS[level];
  }

  /**
   * 体調レベルに応じたlucide-reactアイコン名を取得
   */
  static getConditionIcon(level: ConditionLevel): string {
    return HealthLogEntity.CONDITION_ICONS[level];
  }

  /**
   * 症状ラベルを取得
   */
  static getSymptomLabel(symptom: SymptomType): string {
    return SYMPTOM_LABELS[symptom];
  }

  /**
   * 記録を日付ごとにグループ化（新しい順）
   */
  static groupByDate(logs: HealthLog[]): DailyHealthLogGroup[] {
    const groups = new Map<string, HealthLog[]>();

    for (const log of logs) {
      const dateStr = DateRangeHelper.toDateKey(log.recordedAt);
      if (!groups.has(dateStr)) {
        groups.set(dateStr, []);
      }
      groups.get(dateStr)!.push(log);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dateLogs]) => ({ date, logs: dateLogs }));
  }

  /**
   * 期間内の平均体調レベルを算出
   */
  static getAverageCondition(logs: HealthLog[]): number {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, log) => acc + log.conditionLevel, 0);
    return Math.round((sum / logs.length) * 10) / 10;
  }

  /**
   * 最も多い症状を取得
   */
  static getMostFrequentSymptoms(logs: HealthLog[], limit: number = 3): { symptom: SymptomType; count: number }[] {
    const counts = new Map<SymptomType, number>();
    for (const log of logs) {
      for (const symptom of log.symptoms) {
        counts.set(symptom, (counts.get(symptom) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 日付を日本語形式でフォーマット
   */
  static formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return `${date.getMonth() + 1}月${date.getDate()}日(${DateRangeHelper.getDayOfWeekLabel(date)})`;
  }

  /**
   * 日ごとの平均体調レベルを算出（古い→新しい順）
   */
  static getDailyAverages(
    logs: HealthLog[],
    days: number,
    today: Date,
  ): { date: string; dayLabel: string; average: number | null }[] {
    const result: { date: string; dayLabel: string; average: number | null }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = DateRangeHelper.toDateKey(d);
      const dayLabel = DateRangeHelper.getDayOfWeekLabel(d);

      const dayLogs = logs.filter((log) => DateRangeHelper.toDateKey(log.recordedAt) === dateKey);

      if (dayLogs.length === 0) {
        result.push({ date: dateKey, dayLabel, average: null });
      } else {
        const sum = dayLogs.reduce((acc, log) => acc + log.conditionLevel, 0);
        result.push({ date: dateKey, dayLabel, average: Math.round(sum / dayLogs.length) });
      }
    }

    return result;
  }

  /**
   * 体調トレンドの方向を判定
   */
  static getConditionTrendDirection(
    averages: { average: number | null }[],
  ): 'up' | 'down' | 'stable' {
    const values = averages.filter((a) => a.average !== null).map((a) => a.average as number);
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 0.5) return 'up';
    if (diff < -0.5) return 'down';
    return 'stable';
  }

  /**
   * トレンド方向に応じたメッセージを返す
   */
  static getConditionTrendMessage(direction: 'up' | 'down' | 'stable'): string {
    const messages: Record<string, string> = {
      up: '体調が改善傾向です',
      down: '体調が下降傾向です',
      stable: '体調は安定しています',
    };
    return messages[direction];
  }

  /**
   * トレンド方向に応じたスタイルクラスを返す
   */
  static getConditionTrendStyle(direction: 'up' | 'down' | 'stable'): { text: string; icon: string } {
    const styles: Record<string, { text: string; icon: string }> = {
      up: { text: 'text-green-600', icon: 'TrendingUp' },
      down: { text: 'text-red-600', icon: 'TrendingDown' },
      stable: { text: 'text-gray-600', icon: 'Minus' },
    };
    return styles[direction];
  }

  /**
   * 症状のペア(同時出現)を集計する
   */
  static getSymptomPairs(logs: HealthLog[]): Map<string, number> {
    const pairs = new Map<string, number>();
    for (const log of logs) {
      const sorted = [...log.symptoms].sort();
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const key = `${sorted[i]}+${sorted[j]}`;
          pairs.set(key, (pairs.get(key) || 0) + 1);
        }
      }
    }
    return pairs;
  }

  /**
   * 特定の2症状の同時出現率を算出(0-100%)
   */
  static getCoOccurrenceRate(logs: HealthLog[], symptom1: SymptomType, symptom2: SymptomType): number {
    const logsWithSymptom1 = logs.filter((l) => l.symptoms.includes(symptom1));
    if (logsWithSymptom1.length === 0) return 0;
    const coOccurrences = logsWithSymptom1.filter((l) => l.symptoms.includes(symptom2)).length;
    return MathHelper.calculatePercentage(coOccurrences, logsWithSymptom1.length);
  }

  /**
   * 最も多い症状ペアを返す
   */
  static getMostCommonPair(logs: HealthLog[]): { pair: string; count: number } | null {
    const pairs = HealthLogEntity.getSymptomPairs(logs);
    if (pairs.size === 0) return null;
    let maxPair = '';
    let maxCount = 0;
    for (const [pair, count] of pairs) {
      if (count > maxCount) {
        maxPair = pair;
        maxCount = count;
      }
    }
    return { pair: maxPair, count: maxCount };
  }

  /**
   * 記録群の週間サマリーを算出
   */
  static getWeeklySummary(logs: HealthLog[]): {
    totalLogs: number;
    averageCondition: number | null;
    topSymptom: SymptomType | null;
  } {
    if (logs.length === 0) {
      return { totalLogs: 0, averageCondition: null, topSymptom: null };
    }
    const avg = HealthLogEntity.getAverageCondition(logs);
    const symptoms = HealthLogEntity.getMostFrequentSymptoms(logs, 1);
    return {
      totalLogs: logs.length,
      averageCondition: Math.round(avg),
      topSymptom: symptoms.length > 0 ? symptoms[0].symptom : null,
    };
  }

  /**
   * 前週との体調変化率を算出(%)
   */
  static getConditionChangeRate(currentAvg: number, previousAvg: number): number {
    return MathHelper.calculateChangeRate(previousAvg, currentAvg);
  }

  /**
   * 連続記録間で体調レベルが大きく変化した箇所を検知する
   * logsは新しい順に並んでいる前提
   */
  static detectConditionChange(
    logs: HealthLog[],
    threshold: number = 2,
  ): { from: ConditionLevel; to: ConditionLevel; date: Date }[] {
    const changes: { from: ConditionLevel; to: ConditionLevel; date: Date }[] = [];
    for (let i = 0; i < logs.length - 1; i++) {
      const diff = Math.abs(logs[i].conditionLevel - logs[i + 1].conditionLevel);
      if (diff >= threshold) {
        changes.push({
          from: logs[i + 1].conditionLevel,
          to: logs[i].conditionLevel,
          date: logs[i].recordedAt,
        });
      }
    }
    return changes;
  }

  /**
   * 直近の記録から体調の傾向を判定する
   * logsは新しい順に並んでいる前提
   */
  static getConditionTrend(logs: HealthLog[]): 'improving' | 'declining' | 'stable' {
    if (logs.length <= 1) return 'stable';
    const recent = logs[0].conditionLevel;
    const oldest = logs[logs.length - 1].conditionLevel;
    if (recent > oldest) return 'improving';
    if (recent < oldest) return 'declining';
    return 'stable';
  }

  /**
   * 最も体調が悪かった記録を返す
   */
  static getWorstDay(logs: HealthLog[]): HealthLog | null {
    if (logs.length === 0) return null;
    return logs.reduce((worst, log) => (log.conditionLevel < worst.conditionLevel ? log : worst));
  }

  /**
   * 特定症状の深刻度スコア(0-100)を算出する
   * 症状が体調レベル1-2の時に出現する割合
   */
  static getSymptomSeverityScore(logs: HealthLog[], symptom: SymptomType): number {
    const logsWithSymptom = logs.filter((l) => l.symptoms.includes(symptom));
    if (logsWithSymptom.length === 0) return 0;
    const lowConditionCount = logsWithSymptom.filter((l) => l.conditionLevel <= 2).length;
    return MathHelper.calculatePercentage(lowConditionCount, logsWithSymptom.length);
  }

  /**
   * 深刻度スコアに応じたリスクレベルを返す
   */
  static getSymptomRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * 最も深刻度が高い症状を返す
   */
  static getMostSevereSymptom(
    logs: HealthLog[],
  ): { symptom: SymptomType; score: number } | null {
    const allSymptoms = new Set<SymptomType>();
    for (const log of logs) {
      for (const s of log.symptoms) {
        allSymptoms.add(s);
      }
    }
    if (allSymptoms.size === 0) return null;
    let best: { symptom: SymptomType; score: number } | null = null;
    for (const symptom of allSymptoms) {
      const score = HealthLogEntity.getSymptomSeverityScore(logs, symptom);
      if (!best || score > best.score) {
        best = { symptom, score };
      }
    }
    return best;
  }

  /**
   * 全症状の出現回数を多い順に返す
   */
  static getSymptomCountSummary(
    logs: HealthLog[],
  ): { symptom: SymptomType; label: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const log of logs) {
      for (const s of log.symptoms) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([symptom, count]) => ({
        symptom: symptom as SymptomType,
        label: SYMPTOM_LABELS[symptom as SymptomType],
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 症状コード配列を日本語ラベル配列に変換する
   */
  static getSymptomLabels(symptoms: SymptomType[]): string[] {
    return symptoms.map((s) => SYMPTOM_LABELS[s]);
  }

  /**
   * 体調レベルと症状の要約テキストを生成する
   */
  static formatConditionSummary(level: ConditionLevel, symptoms: SymptomType[]): string {
    const condLabel = HealthLogEntity.getConditionLabel(level);
    if (symptoms.length === 0) return `体調: ${condLabel}`;
    const symptomLabels = HealthLogEntity.getSymptomLabels(symptoms);
    return `体調: ${condLabel} / ${symptomLabels.join(', ')}`;
  }

  /**
   * 体調レベル別の分布を返す
   */
  static getConditionDistribution(logs: HealthLog[]): Record<ConditionLevel, number> {
    const dist: Record<ConditionLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const log of logs) {
      dist[log.conditionLevel]++;
    }
    return dist;
  }

  /**
   * 期間の体調サマリーメッセージを返す
   */
  static getPeriodSummaryMessage(logs: HealthLog[]): string {
    if (logs.length === 0) return 'この期間の記録はありません';
    const avg = HealthLogEntity.getAverageCondition(logs);
    if (avg >= 4) return `${logs.length}件の記録があり、体調は良好です`;
    if (avg >= 3) return `${logs.length}件の記録があり、体調は普通です`;
    return `${logs.length}件の記録があり、体調に注意が必要です`;
  }

  /**
   * 症状数の増減トレンドメッセージを返す
   */
  static getSymptomTrendMessage(currentCount: number, previousCount: number): string {
    const diff = currentCount - previousCount;
    if (Math.abs(diff) <= 1) return '症状数に大きな変化はありません';
    if (diff > 0) return `症状が${diff}件増加しています`;
    return `症状が${Math.abs(diff)}件減少しています`;
  }

  /**
   * 体調改善率を算出する（現在 - 過去の差）
   */
  static getConditionImprovementRate(currentAvg: number, previousAvg: number): number {
    return currentAvg - previousAvg;
  }

  /**
   * 記録頻度に応じたメッセージを返す
   */
  /**
   * 体温値からカテゴリを判定する
   */
  static classifyTemperature(temperature: number | null): 'hypothermia' | 'normal' | 'low_fever' | 'fever' | 'high_fever' | 'unknown' {
    if (temperature === null) return 'unknown';
    if (temperature < HealthLogEntity.TEMP_HYPOTHERMIA) return 'hypothermia';
    if (temperature < HealthLogEntity.TEMP_LOW_FEVER) return 'normal';
    if (temperature < HealthLogEntity.TEMP_FEVER) return 'low_fever';
    if (temperature < HealthLogEntity.TEMP_HIGH_FEVER) return 'fever';
    return 'high_fever';
  }

  private static readonly TEMPERATURE_LABELS: Record<string, string> = {
    hypothermia: '低体温',
    normal: '平熱',
    low_fever: '微熱',
    fever: '発熱',
    high_fever: '高熱',
    unknown: '不明',
  };

  /**
   * 体温カテゴリの日本語ラベルを返す
   */
  static getTemperatureLabel(category: string): string {
    return HealthLogEntity.TEMPERATURE_LABELS[category] || '不明';
  }

  /**
   * 体調レベルと症状数から総合ヘルススコア(0-100)を算出する
   */
  static calculateHealthScore(conditionLevel: number, symptomCount: number): number {
    const baseScore = (conditionLevel / 5) * 100;
    const penalty = symptomCount * 10;
    return Math.max(0, Math.round(baseScore - penalty));
  }

  static getRecordFrequencyMessage(recordDays: number, totalDays: number): string {
    if (recordDays === 0) return '記録を始めましょう';
    if (recordDays === totalDays) return '毎日記録できています';
    if (recordDays >= totalDays / 2) return '順調に記録できています';
    return 'もう少し記録をつけてみましょう';
  }

  /**
   * 症状別の出現頻度を降順で返す
   */
  static getSymptomFrequency(symptoms: string[]): Array<{ symptom: string; count: number }> {
    const counts: Record<string, number> = {};
    for (const s of symptoms) {
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 症状数に応じたラベルを返す
   */
  static getSymptomCountLabel(count: number): string {
    if (count === 0) return '症状なし';
    if (count <= 2) return '軽度';
    if (count <= 4) return '中度';
    return '重度';
  }

  /**
   * 最も頻度が高い症状を返す
   */
  static getMostCommonSymptom(symptoms: string[]): string | null {
    if (symptoms.length === 0) return null;
    const freq = HealthLogEntity.getSymptomFrequency(symptoms);
    return freq[0].symptom;
  }

  /**
   * 期間別平均体調スコアを返す（小数点第1位）
   */
  static getPeriodAverageCondition(logs: { condition: number }[]): number {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((a, b) => a + b.condition, 0);
    return Math.round((sum / logs.length) * 10) / 10;
  }

  /**
   * 体調値の安定度スコア(0-100)を返す
   */
  static getConditionStabilityScore(conditions: number[]): number {
    if (conditions.length <= 1) return conditions.length === 0 ? 0 : 100;
    const avg = conditions.reduce((a, b) => a + b, 0) / conditions.length;
    const variance = conditions.reduce((sum, c) => sum + (c - avg) ** 2, 0) / conditions.length;
    const stdDev = Math.sqrt(variance);
    const maxStdDev = 2;
    return Math.round(Math.max(0, Math.min(100, 100 - (stdDev / maxStdDev) * 100)));
  }

  /**
   * 2期間の平均体調を比較しラベルを返す
   */
  static getConditionComparisonLabel(previousAvg: number, currentAvg: number): string {
    const diff = currentAvg - previousAvg;
    if (diff >= 1) return '体調が改善しています';
    if (diff <= -1) return '体調がやや低下しています';
    return '体調は安定しています';
  }

  /**
   * 症状の共起ペアを集計する
   */
  static getSymptomCooccurrence(logs: { symptoms: string[] }[]): Array<{ pair: string[]; count: number }> {
    const pairCounts = new Map<string, number>();
    for (const log of logs) {
      const symptoms = log.symptoms;
      for (let i = 0; i < symptoms.length; i++) {
        for (let j = i + 1; j < symptoms.length; j++) {
          const pair = [symptoms[i], symptoms[j]].sort();
          const key = pair.join('|');
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
      }
    }
    return Array.from(pairCounts.entries())
      .map(([key, count]) => ({ pair: key.split('|'), count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 最も多い症状共起ペアを返す
   */
  static getMostCommonSymptomPair(logs: { symptoms: string[] }[]): { pair: string[]; count: number } | null {
    const cooccurrences = HealthLogEntity.getSymptomCooccurrence(logs);
    return cooccurrences.length > 0 ? cooccurrences[0] : null;
  }

  /**
   * 共起回数に応じた相関ラベルを返す
   */
  static getSymptomCorrelationLabel(count: number): string {
    if (count >= 5) return '強い相関';
    if (count >= 3) return '中程度の相関';
    if (count >= 1) return '弱い相関';
    return '相関なし';
  }

  /**
   * 週間の体調・症状サマリーを算出する（簡易版）
   */
  static getConditionWeeklySummary(
    logs: { condition: number; symptoms: string[] }[],
  ): {
    logCount: number;
    averageCondition: number | null;
    symptomCount: number;
    mostCommonSymptom: string | null;
  } {
    if (logs.length === 0) {
      return { logCount: 0, averageCondition: null, symptomCount: 0, mostCommonSymptom: null };
    }
    const avgCondition = logs.reduce((sum, l) => sum + l.condition, 0) / logs.length;
    const allSymptoms = logs.flatMap((l) => l.symptoms);
    const symptomCounts = new Map<string, number>();
    for (const s of allSymptoms) {
      symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
    }
    let mostCommon: string | null = null;
    let maxCount = 0;
    for (const [symptom, count] of symptomCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = symptom;
      }
    }
    return {
      logCount: logs.length,
      averageCondition: Math.round(avgCondition * 100) / 100,
      symptomCount: allSymptoms.length,
      mostCommonSymptom: mostCommon,
    };
  }

  /**
   * 週間サマリーの状態ラベルを返す
   */
  static getConditionWeeklySummaryLabel(averageCondition: number | null, symptomCount: number): string {
    if (averageCondition === null) return 'データ不足';
    if (averageCondition >= 4 && symptomCount <= 1) return '体調良好';
    if (averageCondition >= 3) return 'やや不調';
    return '注意が必要';
  }

  /**
   * 直近の体調データから次の体調を予測する(1-5)
   */
  static predictNextCondition(conditions: number[]): number | null {
    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];
    const last = conditions[conditions.length - 1];
    const prev = conditions[conditions.length - 2];
    const trend = last - prev;
    const predicted = last + trend;
    return Math.max(1, Math.min(5, Math.round(predicted)));
  }

  /**
   * 体調予測トレンドに応じたメッセージを返す
   */
  /**
   * 今日から遡って連続記録日数を算出する
   */
  static getLogStreak(dateKeys: string[], todayKey: string): number {
    if (dateKeys.length === 0) return 0;
    const sorted = [...new Set(dateKeys)].sort((a, b) => b.localeCompare(a));
    if (sorted[0] !== todayKey) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00');
      const curr = new Date(sorted[i] + 'T00:00:00');
      const diffMs = prev.getTime() - curr.getTime();
      if (Math.round(diffMs / (1000 * 60 * 60 * 24)) === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * 連続記録日数のラベルを返す
   */
  static getLogStreakLabel(days: number): string {
    if (days === 0) return '記録なし';
    if (days === 1) return '記録開始';
    if (days % 30 === 0) return `${days / 30}ヶ月連続`;
    if (days % 7 === 0) return `${days / 7}週間連続`;
    return `${days}日連続`;
  }

  static getConditionPredictionMessage(trend: 'improving' | 'declining' | 'stable'): string {
    const messages: Record<string, string> = {
      improving: '体調が改善傾向にあります',
      declining: '体調の変化に注意してください',
      stable: '体調は安定しています',
    };
    return messages[trend];
  }

  /**
   * 体調レベル配列から変動性スコア(0-100)を算出する
   * 隣接日の差分の平均を使用
   */
  static getConditionVolatility(conditions: number[]): number {
    if (conditions.length <= 1) return 0;
    let totalDiff = 0;
    for (let i = 1; i < conditions.length; i++) {
      totalDiff += Math.abs(conditions[i] - conditions[i - 1]);
    }
    const avgDiff = totalDiff / (conditions.length - 1);
    return Math.min(100, Math.round((avgDiff / HealthLogEntity.VOLATILITY_MAX_DIFF) * 100));
  }

  /**
   * 変動性スコアに応じたラベルを返す
   */
  static getVolatilityLabel(score: number): string {
    if (score <= HealthLogEntity.VOLATILITY_STABLE_THRESHOLD) return '安定';
    if (score <= HealthLogEntity.VOLATILITY_MODERATE_THRESHOLD) return 'やや変動';
    return '不安定';
  }

  /**
   * 症状リストからユニーク症状数に基づく多様性スコア(0-100)を算出する
   */
  static getSymptomDiversity(symptoms: string[], totalKnownSymptoms: number): number {
    if (symptoms.length === 0 || totalKnownSymptoms <= 0) return 0;
    const unique = new Set(symptoms).size;
    return Math.min(100, Math.round((unique / totalKnownSymptoms) * 100));
  }

  /**
   * 症状多様性スコアに応じたラベルを返す
   */
  /**
   * 体調レベル配列から回復速度スコア(0-100)を算出する
   * 上昇ステップの割合をスコア化（横ばいは中立=50基準）
   */
  static getConditionRecoveryRate(conditions: number[]): number {
    if (conditions.length <= 1) return 0;
    let upSteps = 0;
    let downSteps = 0;
    for (let i = 1; i < conditions.length; i++) {
      const diff = conditions[i] - conditions[i - 1];
      if (diff > 0) upSteps++;
      else if (diff < 0) downSteps++;
    }
    const totalSteps = conditions.length - 1;
    const neutralSteps = totalSteps - upSteps - downSteps;
    const score = ((upSteps + neutralSteps * 0.5) / totalSteps) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * 回復速度スコアに応じたラベルを返す
   */
  static getRecoveryRateLabel(score: number): string {
    if (score >= HealthLogEntity.RECOVERY_GOOD_THRESHOLD) return '良好な回復';
    if (score >= HealthLogEntity.RECOVERY_MODERATE_THRESHOLD) return '緩やかな回復';
    return '回復が遅い';
  }

  static getSymptomDiversityLabel(score: number): string {
    if (score >= HealthLogEntity.DIVERSITY_HIGH_THRESHOLD) return '多様';
    if (score >= HealthLogEntity.DIVERSITY_MEDIUM_THRESHOLD) return '中程度';
    return '限定的';
  }

  /**
   * 体調レベル配列の直近の変化速度（モメンタム）を算出する
   * 直近3件の傾き（正=改善、負=悪化、0=横ばい）
   */
  static getConditionMomentum(conditions: number[]): number {
    if (conditions.length <= 1) return 0;
    const recent = conditions.slice(-3);
    if (recent.length <= 1) return 0;
    const diffs: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      diffs.push(recent[i] - recent[i - 1]);
    }
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return Math.round(avg * 10) / 10;
  }

  /**
   * モメンタムに応じたラベルを返す
   */
  static getMomentumLabel(momentum: number): string {
    if (momentum >= HealthLogEntity.MOMENTUM_THRESHOLD) return '改善傾向';
    if (momentum <= -HealthLogEntity.MOMENTUM_THRESHOLD) return '悪化傾向';
    return '変化なし';
  }

  /**
   * 体調レベル配列の分散値を算出する
   */
  static getConditionVariance(conditions: number[]): number {
    if (conditions.length <= 1) return 0;
    const avg = conditions.reduce((a, b) => a + b, 0) / conditions.length;
    const variance = conditions.reduce((sum, c) => sum + (c - avg) ** 2, 0) / conditions.length;
    return Math.round(variance * 100) / 100;
  }

  /**
   * 分散値に応じたラベルを返す
   */
  static getConditionVarianceLabel(variance: number): string {
    if (variance < HealthLogEntity.VARIANCE_STABLE_THRESHOLD) return '安定';
    if (variance < HealthLogEntity.VARIANCE_UNSTABLE_THRESHOLD) return 'やや不安定';
    return '不安定';
  }
}
