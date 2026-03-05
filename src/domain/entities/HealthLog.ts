/**
 * 体調記録エンティティ
 */

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
      const d = log.recordedAt;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日(${days[date.getDay()]})`;
  }

  /**
   * 日ごとの平均体調レベルを算出（古い→新しい順）
   */
  static getDailyAverages(
    logs: HealthLog[],
    days: number,
    today: Date,
  ): { date: string; dayLabel: string; average: number | null }[] {
    const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const result: { date: string; dayLabel: string; average: number | null }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = dayLabels[d.getDay()];

      const dayLogs = logs.filter((log) => {
        const ld = log.recordedAt;
        const logKey = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
        return logKey === dateKey;
      });

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
}
