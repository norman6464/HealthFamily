import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('ComplianceGrade エッジケース', () => {
  describe('getComplianceGrade 境界値', () => {
    it('正確な境界値で正しいグレードを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(89)).toBe('B');
      expect(AdherenceStatsEntity.getComplianceGrade(90)).toBe('A');
      expect(AdherenceStatsEntity.getComplianceGrade(79)).toBe('C');
      expect(AdherenceStatsEntity.getComplianceGrade(80)).toBe('B');
      expect(AdherenceStatsEntity.getComplianceGrade(59)).toBe('D');
      expect(AdherenceStatsEntity.getComplianceGrade(60)).toBe('C');
      expect(AdherenceStatsEntity.getComplianceGrade(39)).toBe('F');
      expect(AdherenceStatsEntity.getComplianceGrade(40)).toBe('D');
    });

    it('100%はAを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(100)).toBe('A');
    });

    it('0%はFを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(0)).toBe('F');
    });
  });

  describe('全グレードの色とメッセージの一貫性', () => {
    const grades = ['A', 'B', 'C', 'D', 'F'] as const;

    it('全グレードにメッセージが定義されている', () => {
      for (const grade of grades) {
        const message = AdherenceStatsEntity.getComplianceMessage(grade);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      }
    });

    it('全グレードに色クラスが定義されている', () => {
      for (const grade of grades) {
        const color = AdherenceStatsEntity.getComplianceColor(grade);
        expect(color).toMatch(/^text-\w+-\d+$/);
      }
    });
  });
});
