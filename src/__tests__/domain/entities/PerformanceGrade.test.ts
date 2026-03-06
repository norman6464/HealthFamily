import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Performance Grade', () => {
  describe('getPerformanceGrade', () => {
    it('高い遵守率と高い一貫性でAグレード', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(95, 90)).toBe('A');
    });

    it('高い遵守率と中程度の一貫性でBグレード', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(85, 70)).toBe('B');
    });

    it('中程度の遵守率でCグレード', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(50, 50)).toBe('C');
    });

    it('低い遵守率でDグレード', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(20, 20)).toBe('D');
    });

    it('100/100はA', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(100, 100)).toBe('A');
    });

    it('0/0はD', () => {
      expect(AdherenceTrendEntity.getPerformanceGrade(0, 0)).toBe('D');
    });
  });

  describe('getPerformanceGradeLabel', () => {
    it('Aは優秀', () => {
      expect(AdherenceTrendEntity.getPerformanceGradeLabel('A')).toBe('優秀');
    });

    it('Bは良好', () => {
      expect(AdherenceTrendEntity.getPerformanceGradeLabel('B')).toBe('良好');
    });

    it('Cは要改善', () => {
      expect(AdherenceTrendEntity.getPerformanceGradeLabel('C')).toBe('要改善');
    });

    it('Dは要注意', () => {
      expect(AdherenceTrendEntity.getPerformanceGradeLabel('D')).toBe('要注意');
    });
  });
});
