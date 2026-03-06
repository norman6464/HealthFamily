import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Weekly Summary Edge Cases', () => {
  describe('getConditionWeeklySummary', () => {
    it('全て同じ体調レベル', () => {
      const logs = Array.from({ length: 7 }, () => ({ condition: 3, symptoms: [] }));
      const result = HealthLogEntity.getConditionWeeklySummary(logs);
      expect(result.averageCondition).toBe(3);
      expect(result.mostCommonSymptom).toBeNull();
    });

    it('1件のログ', () => {
      const logs = [{ condition: 5, symptoms: ['headache'] }];
      const result = HealthLogEntity.getConditionWeeklySummary(logs);
      expect(result.logCount).toBe(1);
      expect(result.averageCondition).toBe(5);
      expect(result.mostCommonSymptom).toBe('headache');
    });

    it('全症状が同頻度の場合は最初に見つかったものを返す', () => {
      const logs = [
        { condition: 3, symptoms: ['A'] },
        { condition: 3, symptoms: ['B'] },
      ];
      const result = HealthLogEntity.getConditionWeeklySummary(logs);
      expect(result.mostCommonSymptom).toBe('A');
    });

    it('体調レベル1と5の平均', () => {
      const logs = [
        { condition: 1, symptoms: [] },
        { condition: 5, symptoms: [] },
      ];
      const result = HealthLogEntity.getConditionWeeklySummary(logs);
      expect(result.averageCondition).toBe(3);
    });
  });

  describe('getConditionWeeklySummaryLabel', () => {
    it('境界値: condition=4, symptom=1で体調良好', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(4, 1)).toBe('体調良好');
    });

    it('境界値: condition=4, symptom=2でやや不調', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(4, 2)).toBe('やや不調');
    });

    it('境界値: condition=3, symptom=0でやや不調', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(3, 0)).toBe('やや不調');
    });

    it('境界値: condition=2.99で注意が必要', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(2.99, 0)).toBe('注意が必要');
    });

    it('condition=5, symptom=0で体調良好', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(5, 0)).toBe('体調良好');
    });
  });
});
