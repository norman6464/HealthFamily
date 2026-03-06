import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Weekly Summary', () => {
  describe('getWeeklySummary', () => {
    it('7日分のログを集計', () => {
      const logs = [
        { condition: 4, symptoms: ['headache'] },
        { condition: 3, symptoms: ['fatigue'] },
        { condition: 5, symptoms: [] },
        { condition: 4, symptoms: ['headache', 'fatigue'] },
        { condition: 2, symptoms: ['nausea'] },
        { condition: 4, symptoms: [] },
        { condition: 3, symptoms: ['headache'] },
      ];
      const result = HealthLogEntity.getConditionWeeklySummary(logs);
      expect(result.logCount).toBe(7);
      expect(result.averageCondition).toBeCloseTo(3.57, 1);
      expect(result.symptomCount).toBe(6);
      expect(result.mostCommonSymptom).toBe('headache');
    });

    it('空配列', () => {
      const result = HealthLogEntity.getConditionWeeklySummary([]);
      expect(result.logCount).toBe(0);
      expect(result.averageCondition).toBeNull();
      expect(result.symptomCount).toBe(0);
      expect(result.mostCommonSymptom).toBeNull();
    });

    it('症状なしのログのみ', () => {
      const logs = [
        { condition: 5, symptoms: [] },
        { condition: 4, symptoms: [] },
      ];
      const result = HealthLogEntity.getConditionWeeklySummary(logs);
      expect(result.logCount).toBe(2);
      expect(result.symptomCount).toBe(0);
      expect(result.mostCommonSymptom).toBeNull();
    });
  });

  describe('getConditionWeeklySummaryLabel', () => {
    it('体調良好', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(4.5, 0)).toBe('体調良好');
    });

    it('やや不調', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(3.0, 3)).toBe('やや不調');
    });

    it('注意が必要', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(2.0, 5)).toBe('注意が必要');
    });

    it('体調nullでログあり', () => {
      expect(HealthLogEntity.getConditionWeeklySummaryLabel(null, 2)).toBe('データ不足');
    });
  });
});
