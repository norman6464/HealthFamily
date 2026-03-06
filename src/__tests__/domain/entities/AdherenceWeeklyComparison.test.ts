import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity 週次比較', () => {
  describe('getWeeklyComparisonDetail', () => {
    it('改善時は改善メッセージとプラスの差を返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(90, 70);
      expect(result.direction).toBe('up');
      expect(result.diff).toBe(20);
      expect(result.message).toContain('改善');
    });

    it('悪化時は悪化メッセージとマイナスの差を返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(50, 80);
      expect(result.direction).toBe('down');
      expect(result.diff).toBe(30);
      expect(result.message).toContain('低下');
    });

    it('差5以内は維持メッセージを返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(75, 72);
      expect(result.direction).toBe('stable');
      expect(result.message).toContain('維持');
    });

    it('同値は維持メッセージを返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(80, 80);
      expect(result.direction).toBe('stable');
    });
  });

  describe('getRateChangeLabel', () => {
    it('正の変化はプラス表記を返す', () => {
      expect(AdherenceStatsEntity.getRateChangeLabel(15)).toBe('+15%');
    });

    it('負の変化はマイナス表記を返す', () => {
      expect(AdherenceStatsEntity.getRateChangeLabel(-10)).toBe('-10%');
    });

    it('0は変化なしを返す', () => {
      expect(AdherenceStatsEntity.getRateChangeLabel(0)).toBe('変化なし');
    });
  });

  describe('getMotivationMessage', () => {
    it('90%以上は最高のメッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(95);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('70%以上は良好のメッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(75);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('50%以上は励ましのメッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(55);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('50%未満は改善提案のメッセージを返す', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(30);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('各レベルで異なるメッセージを返す', () => {
      const msgs = [95, 75, 55, 30].map((r) => AdherenceStatsEntity.getMotivationMessage(r));
      const unique = new Set(msgs);
      expect(unique.size).toBe(4);
    });
  });
});
