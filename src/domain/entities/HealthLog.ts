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
  /**
   * 体調レベルのラベルを取得
   */
  static getConditionLabel(level: ConditionLevel): string {
    const labels: Record<ConditionLevel, string> = {
      1: 'とても悪い',
      2: '悪い',
      3: '普通',
      4: '良い',
      5: 'とても良い',
    };
    return labels[level];
  }

  /**
   * 体調レベルのカラークラスを取得
   */
  static getConditionColor(level: ConditionLevel): string {
    const colors: Record<ConditionLevel, string> = {
      1: 'text-red-600',
      2: 'text-orange-500',
      3: 'text-yellow-500',
      4: 'text-green-500',
      5: 'text-green-600',
    };
    return colors[level];
  }

  /**
   * 体調レベルに応じたlucide-reactアイコン名を取得
   */
  static getConditionIcon(level: ConditionLevel): string {
    const icons: Record<ConditionLevel, string> = {
      1: 'Frown',
      2: 'Meh',
      3: 'MinusCircle',
      4: 'Smile',
      5: 'Laugh',
    };
    return icons[level];
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
    if (previousAvg === 0) return 0;
    return Math.round(((currentAvg - previousAvg) / previousAvg) * 100);
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
}
