import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('DoseRegularity エッジケーステスト', () => {
  describe('getDoseRegularity', () => {
    it('空配列の場合0を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularity([])).toBe(0);
    });

    it('1要素の場合100を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularity([0])).toBe(100);
    });

    it('全て0の場合100を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularity([0, 0, 0])).toBe(100);
    });

    it('最大値1440の同一値で100を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularity([1440, 1440, 1440])).toBe(100);
    });

    it('2要素で同値の場合100を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularity([300, 300])).toBe(100);
    });

    it('非常に大きなばらつきでも0以上を返す', () => {
      const score = MedicationRecordEntity.getDoseRegularity([0, 1440]);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('負の値を含む場合も計算する', () => {
      const score = MedicationRecordEntity.getDoseRegularity([-60, 60]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('大量の均一値で100を返す', () => {
      const times = Array(100).fill(480);
      expect(MedicationRecordEntity.getDoseRegularity(times)).toBe(100);
    });

    it('小さなばらつきで高スコアを返す', () => {
      const score = MedicationRecordEntity.getDoseRegularity([480, 481, 479, 480]);
      expect(score).toBeGreaterThan(95);
    });
  });

  describe('getDoseRegularityLabel', () => {
    it('境界値: 80は規則的を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularityLabel(80)).toBe('規則的');
    });

    it('境界値: 79はやや不規則を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularityLabel(79)).toBe('やや不規則');
    });

    it('境界値: 50はやや不規則を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularityLabel(50)).toBe('やや不規則');
    });

    it('境界値: 49は不規則を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularityLabel(49)).toBe('不規則');
    });

    it('100は規則的を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularityLabel(100)).toBe('規則的');
    });

    it('0は不規則を返す', () => {
      expect(MedicationRecordEntity.getDoseRegularityLabel(0)).toBe('不規則');
    });
  });
});
