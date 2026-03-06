import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Performance Grade Edge Cases', () => {
  describe('getPerformanceGrade', () => {
    it('境界値80はA', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(80, 80)).toBe('A');
    });

    it('境界値79.9はB', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(79, 80)).toBe('B');
    });

    it('境界値60はB', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(60, 60)).toBe('B');
    });

    it('境界値59はC', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(59, 59)).toBe('C');
    });

    it('境界値40はC', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(40, 40)).toBe('C');
    });

    it('境界値39はD', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(39, 39)).toBe('D');
    });

    it('片方だけ高い場合の組み合わせ', () => {
      // (100+0)/2 = 50 → C
      expect(AdherenceTrendEntity.getPerformanceGrade(100, 0)).toBe('C');
    });
  });

  describe('getPerformanceGradeLabel', () => {
    it('不明なグレードは要注意', () => {
      expect(AdherenceTrendEntity.getPerformanceGradeLabel('X')).toBe('要注意');
    });

    it('空文字は要注意', () => {
      expect(AdherenceTrendEntity.getPerformanceGradeLabel('')).toBe('要注意');
    });
  });
});
