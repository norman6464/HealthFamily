import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity 曜日別服薬率分析', () => {
  describe('getDayOfWeekRates', () => {
    it('空の記録・期待値は全曜日0%を返す', () => {
      const result = AdherenceStatsEntity.getDayOfWeekRates([], [0, 0, 0, 0, 0, 0, 0]);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('期待値が0の曜日は0%を返す', () => {
      const records = [new Date('2026-03-02')]; // 月曜
      const expected = [0, 0, 0, 0, 0, 0, 0]; // 期待値0
      const result = AdherenceStatsEntity.getDayOfWeekRates(records, expected);
      expect(result[1]).toBe(0);
    });

    it('月曜に1回記録・月曜の期待値1で100%を返す', () => {
      const records = [new Date('2026-03-02')]; // 月曜
      const expected = [0, 1, 0, 0, 0, 0, 0];
      const result = AdherenceStatsEntity.getDayOfWeekRates(records, expected);
      expect(result[1]).toBe(100);
    });

    it('月曜に1回記録・月曜の期待値2で50%を返す', () => {
      const records = [new Date('2026-03-02')]; // 月曜
      const expected = [0, 2, 0, 0, 0, 0, 0];
      const result = AdherenceStatsEntity.getDayOfWeekRates(records, expected);
      expect(result[1]).toBe(50);
    });

    it('複数曜日の記録を正しく集計する', () => {
      const records = [
        new Date('2026-03-02'), // 月
        new Date('2026-03-04'), // 水
        new Date('2026-03-04'), // 水（2回目）
      ];
      const expected = [0, 1, 0, 2, 0, 0, 0];
      const result = AdherenceStatsEntity.getDayOfWeekRates(records, expected);
      expect(result[1]).toBe(100); // 月: 1/1
      expect(result[3]).toBe(100); // 水: 2/2
    });
  });

  describe('getBestDay', () => {
    it('全曜日0%の場合はnullを返す', () => {
      expect(AdherenceStatsEntity.getBestDay([0, 0, 0, 0, 0, 0, 0])).toBeNull();
    });

    it('最も高い率の曜日インデックスを返す', () => {
      expect(AdherenceStatsEntity.getBestDay([50, 80, 70, 100, 60, 90, 40])).toBe(3); // 水
    });

    it('同率の場合は最初のインデックスを返す', () => {
      expect(AdherenceStatsEntity.getBestDay([100, 100, 0, 0, 0, 0, 0])).toBe(0); // 日
    });
  });

  describe('getWorstDay', () => {
    it('全曜日0%の場合はnullを返す', () => {
      expect(AdherenceStatsEntity.getWorstDay([0, 0, 0, 0, 0, 0, 0])).toBeNull();
    });

    it('最も低い率の曜日インデックスを返す（0%以外の中で）', () => {
      expect(AdherenceStatsEntity.getWorstDay([0, 80, 70, 100, 60, 90, 40])).toBe(6); // 土
    });

    it('0%の曜日は除外する', () => {
      expect(AdherenceStatsEntity.getWorstDay([0, 50, 30, 0, 0, 0, 0])).toBe(2); // 火
    });
  });
});
