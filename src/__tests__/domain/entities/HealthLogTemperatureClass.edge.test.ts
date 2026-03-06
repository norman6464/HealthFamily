import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogTemperatureClass エッジケース', () => {
  describe('classifyTemperature', () => {
    it('35.0度ちょうどは平熱（境界値）', () => {
      expect(HealthLogEntity.classifyTemperature(35.0)).toBe('normal');
    });

    it('34.9度は低体温（境界値）', () => {
      expect(HealthLogEntity.classifyTemperature(34.9)).toBe('hypothermia');
    });

    it('37.49度は平熱（境界値）', () => {
      expect(HealthLogEntity.classifyTemperature(37.49)).toBe('normal');
    });

    it('38.99度は発熱（境界値）', () => {
      expect(HealthLogEntity.classifyTemperature(38.99)).toBe('fever');
    });

    it('42.0度の高温は高熱', () => {
      expect(HealthLogEntity.classifyTemperature(42.0)).toBe('high_fever');
    });
  });

  describe('calculateHealthScore', () => {
    it('体調レベル2で症状5なら0点（下限クランプ）', () => {
      // 2/5*100=40, 5*10=50, 40-50=-10 → 0
      expect(HealthLogEntity.calculateHealthScore(2, 5)).toBe(0);
    });

    it('体調レベル4で症状1なら70点', () => {
      // 4/5*100=80, 1*10=10, 80-10=70
      expect(HealthLogEntity.calculateHealthScore(4, 1)).toBe(70);
    });

    it('体調レベル1で症状5なら0点', () => {
      // 1/5*100=20, 5*10=50, 20-50=-30 → 0
      expect(HealthLogEntity.calculateHealthScore(1, 5)).toBe(0);
    });
  });
});
