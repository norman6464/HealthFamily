import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel } from '@/domain/entities/HealthLog';

const createLog = (overrides: Partial<HealthLog> = {}): HealthLog => ({
  id: 'log-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  userId: 'user-1',
  conditionLevel: 3 as ConditionLevel,
  symptoms: [],
  recordedAt: new Date('2026-03-05T10:00:00'),
  ...overrides,
});

describe('HealthLogEntity - 週間トレンド', () => {
  describe('getDailyAverages', () => {
    it('日ごとの平均体調レベルを算出する', () => {
      const logs = [
        createLog({ conditionLevel: 4 as ConditionLevel, recordedAt: new Date('2026-03-05T10:00:00') }),
        createLog({ conditionLevel: 2 as ConditionLevel, recordedAt: new Date('2026-03-05T14:00:00') }),
        createLog({ conditionLevel: 5 as ConditionLevel, recordedAt: new Date('2026-03-04T10:00:00') }),
      ];
      const result = HealthLogEntity.getDailyAverages(logs, 7, new Date('2026-03-05'));
      expect(result).toHaveLength(7);
      // 3/5の平均は(4+2)/2=3
      const mar5 = result.find((d) => d.date === '2026-03-05');
      expect(mar5?.average).toBe(3);
      // 3/4の平均は5
      const mar4 = result.find((d) => d.date === '2026-03-04');
      expect(mar4?.average).toBe(5);
    });

    it('記録がない日はnullを返す', () => {
      const logs = [
        createLog({ conditionLevel: 3 as ConditionLevel, recordedAt: new Date('2026-03-05T10:00:00') }),
      ];
      const result = HealthLogEntity.getDailyAverages(logs, 7, new Date('2026-03-05'));
      const mar3 = result.find((d) => d.date === '2026-03-03');
      expect(mar3?.average).toBeNull();
    });

    it('空の記録は全日nullを返す', () => {
      const result = HealthLogEntity.getDailyAverages([], 7, new Date('2026-03-05'));
      expect(result).toHaveLength(7);
      expect(result.every((d) => d.average === null)).toBe(true);
    });

    it('古い日付から新しい日付の順に並ぶ', () => {
      const result = HealthLogEntity.getDailyAverages([], 7, new Date('2026-03-05'));
      expect(result[0].date).toBe('2026-02-27');
      expect(result[6].date).toBe('2026-03-05');
    });

    it('日ラベルが正しく設定される', () => {
      const result = HealthLogEntity.getDailyAverages([], 7, new Date('2026-03-05'));
      // 2026-03-05は木曜日
      expect(result[6].dayLabel).toBe('木');
    });
  });

  describe('getConditionTrendDirection', () => {
    it('上昇トレンドを判定する', () => {
      const averages = [
        { date: '2026-03-01', dayLabel: '日', average: 2 },
        { date: '2026-03-02', dayLabel: '月', average: 3 },
        { date: '2026-03-03', dayLabel: '火', average: 4 },
      ];
      expect(HealthLogEntity.getConditionTrendDirection(averages)).toBe('up');
    });

    it('下降トレンドを判定する', () => {
      const averages = [
        { date: '2026-03-01', dayLabel: '日', average: 4 },
        { date: '2026-03-02', dayLabel: '月', average: 3 },
        { date: '2026-03-03', dayLabel: '火', average: 2 },
      ];
      expect(HealthLogEntity.getConditionTrendDirection(averages)).toBe('down');
    });

    it('横ばいトレンドを判定する', () => {
      const averages = [
        { date: '2026-03-01', dayLabel: '日', average: 3 },
        { date: '2026-03-02', dayLabel: '月', average: 3 },
        { date: '2026-03-03', dayLabel: '火', average: 3 },
      ];
      expect(HealthLogEntity.getConditionTrendDirection(averages)).toBe('stable');
    });

    it('データ不足の場合はstableを返す', () => {
      expect(HealthLogEntity.getConditionTrendDirection([])).toBe('stable');
    });

    it('null値は除外して判定する', () => {
      const averages = [
        { date: '2026-03-01', dayLabel: '日', average: 2 as number | null },
        { date: '2026-03-02', dayLabel: '月', average: null },
        { date: '2026-03-03', dayLabel: '火', average: 4 as number | null },
      ];
      expect(HealthLogEntity.getConditionTrendDirection(averages)).toBe('up');
    });
  });
});
