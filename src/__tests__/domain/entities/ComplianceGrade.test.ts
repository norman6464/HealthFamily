import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity 遵守率グレード判定', () => {
  describe('getComplianceGrade', () => {
    it('90%以上はAを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(90)).toBe('A');
      expect(AdherenceStatsEntity.getComplianceGrade(100)).toBe('A');
    });

    it('80-89%はBを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(80)).toBe('B');
      expect(AdherenceStatsEntity.getComplianceGrade(89)).toBe('B');
    });

    it('60-79%はCを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(60)).toBe('C');
      expect(AdherenceStatsEntity.getComplianceGrade(79)).toBe('C');
    });

    it('40-59%はDを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(40)).toBe('D');
      expect(AdherenceStatsEntity.getComplianceGrade(59)).toBe('D');
    });

    it('40%未満はFを返す', () => {
      expect(AdherenceStatsEntity.getComplianceGrade(39)).toBe('F');
      expect(AdherenceStatsEntity.getComplianceGrade(0)).toBe('F');
    });
  });

  describe('getComplianceMessage', () => {
    it('グレードAは褒めるメッセージ', () => {
      expect(AdherenceStatsEntity.getComplianceMessage('A')).toBe('とても良い服薬管理です');
    });

    it('グレードBは良好メッセージ', () => {
      expect(AdherenceStatsEntity.getComplianceMessage('B')).toBe('良好な服薬管理です');
    });

    it('グレードCは改善提案', () => {
      expect(AdherenceStatsEntity.getComplianceMessage('C')).toBe('もう少し改善できます');
    });

    it('グレードDは注意メッセージ', () => {
      expect(AdherenceStatsEntity.getComplianceMessage('D')).toBe('服薬の見直しが必要です');
    });

    it('グレードFは警告メッセージ', () => {
      expect(AdherenceStatsEntity.getComplianceMessage('F')).toBe('服薬管理を始めましょう');
    });
  });

  describe('getComplianceColor', () => {
    it('グレードAは緑', () => {
      expect(AdherenceStatsEntity.getComplianceColor('A')).toBe('text-green-600');
    });

    it('グレードBは青', () => {
      expect(AdherenceStatsEntity.getComplianceColor('B')).toBe('text-blue-600');
    });

    it('グレードCは黄', () => {
      expect(AdherenceStatsEntity.getComplianceColor('C')).toBe('text-yellow-600');
    });

    it('グレードDはオレンジ', () => {
      expect(AdherenceStatsEntity.getComplianceColor('D')).toBe('text-orange-600');
    });

    it('グレードFは赤', () => {
      expect(AdherenceStatsEntity.getComplianceColor('F')).toBe('text-red-600');
    });
  });
});
