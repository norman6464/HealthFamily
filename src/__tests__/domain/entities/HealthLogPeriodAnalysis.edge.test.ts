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

describe('HealthLogEntity 期間別分析 エッジケース', () => {
  describe('getConditionDistribution', () => {
    it('全レベル1件ずつの場合', () => {
      const logs = [createLog(1), createLog(2), createLog(3), createLog(4), createLog(5)];
      const result = HealthLogEntity.getConditionDistribution(logs);
      expect(Object.values(result).every((v) => v === 1)).toBe(true);
    });
  });

  describe('getPeriodSummaryMessage', () => {
    it('境界値: 平均4.0は良好を返す', () => {
      const logs = [createLog(3), createLog(5)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('良好');
    });

    it('境界値: 平均3.0は普通を返す', () => {
      const logs = [createLog(2), createLog(4)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('普通');
    });

    it('単一ログでも正しくメッセージを返す', () => {
      const logs = [createLog(1)];
      const msg = HealthLogEntity.getPeriodSummaryMessage(logs);
      expect(msg).toContain('1');
      expect(msg).toContain('注意');
    });
  });
});
