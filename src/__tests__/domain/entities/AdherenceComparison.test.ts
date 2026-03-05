import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity 前週比較・遵守率レベル', () => {
  describe('getComparisonMessage', () => {
    it('改善(10%以上増加)は改善メッセージを返す', () => {
      expect(AdherenceStatsEntity.getComparisonMessage(80, 60)).toBe('先週より改善しています');
    });

    it('同等(差が10%未満)は維持メッセージを返す', () => {
      expect(AdherenceStatsEntity.getComparisonMessage(75, 70)).toBe('先週と同じペースです');
    });

    it('悪化(10%以上減少)は悪化メッセージを返す', () => {
      expect(AdherenceStatsEntity.getComparisonMessage(50, 70)).toBe('先週より下がっています');
    });

    it('ちょうど10%増は改善メッセージ(境界)', () => {
      expect(AdherenceStatsEntity.getComparisonMessage(70, 60)).toBe('先週より改善しています');
    });

    it('ちょうど10%減は悪化メッセージ(境界)', () => {
      expect(AdherenceStatsEntity.getComparisonMessage(60, 70)).toBe('先週より下がっています');
    });

    it('9%増は維持メッセージ(境界)', () => {
      expect(AdherenceStatsEntity.getComparisonMessage(69, 60)).toBe('先週と同じペースです');
    });
  });

  describe('getAdherenceLevel', () => {
    it('90%以上はexcellentを返す', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(90)).toBe('excellent');
    });

    it('100%はexcellentを返す', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(100)).toBe('excellent');
    });

    it('70%以上はgoodを返す', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(70)).toBe('good');
    });

    it('89%はgoodを返す(境界)', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(89)).toBe('good');
    });

    it('50%以上はfairを返す', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(50)).toBe('fair');
    });

    it('69%はfairを返す(境界)', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(69)).toBe('fair');
    });

    it('50%未満はpoorを返す', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(49)).toBe('poor');
    });

    it('0%はpoorを返す', () => {
      expect(AdherenceStatsEntity.getAdherenceLevel(0)).toBe('poor');
    });
  });

  describe('getAdherenceLevelStyle', () => {
    it('excellentは緑系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getAdherenceLevelStyle('excellent');
      expect(style.text).toContain('green');
    });

    it('goodは青系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getAdherenceLevelStyle('good');
      expect(style.text).toContain('blue');
    });

    it('fairはオレンジ系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getAdherenceLevelStyle('fair');
      expect(style.text).toContain('orange');
    });

    it('poorは赤系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getAdherenceLevelStyle('poor');
      expect(style.text).toContain('red');
    });
  });
});
