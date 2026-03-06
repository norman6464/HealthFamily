import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel } from '@/domain/entities/HealthLog';

const createLog = (conditionLevel: ConditionLevel): HealthLog => ({
  id: `log-${Math.random()}`,
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  conditionLevel,
  symptoms: [],
  notes: '',
  recordedAt: new Date('2026-03-01'),
});

describe('HealthLogEntity 期間別分析', () => {
  describe('getConditionDistribution', () => {
    it('空配列は全レベル0を返す', () => {
      const result = HealthLogEntity.getConditionDistribution([]);
      expect(result).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    it('各レベルの件数を正しくカウントする', () => {
      const logs = [
        createLog(1), createLog(3), createLog(3), createLog(5),
      ];
      const result = HealthLogEntity.getConditionDistribution(logs);
      expect(result[1]).toBe(1);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(2);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(1);
    });

    it('全て同じレベルの場合', () => {
      const logs = [createLog(4), createLog(4), createLog(4)];
      const result = HealthLogEntity.getConditionDistribution(logs);
      expect(result[4]).toBe(3);
    });
  });

  describe('getPeriodSummaryMessage', () => {
    it('空配列は記録なしメッセージを返す', () => {
      expect(HealthLogEntity.getPeriodSummaryMessage([])).toBe('この期間の記録はありません');
    });

    it('平均4以上は良好メッセージを返す', () => {
      const logs = [createLog(4), createLog(5), createLog(4)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('良好');
    });

    it('平均3以上は普通メッセージを返す', () => {
      const logs = [createLog(3), createLog(3), createLog(4)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('普通');
    });

    it('平均3未満は注意メッセージを返す', () => {
      const logs = [createLog(1), createLog(2), createLog(2)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('注意');
    });

    it('件数を含むメッセージを返す', () => {
      const logs = [createLog(5), createLog(5)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('2');
    });
  });
});
