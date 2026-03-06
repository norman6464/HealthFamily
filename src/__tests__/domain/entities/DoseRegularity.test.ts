import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('getDoseRegularity', () => {
  it('空配列の場合0を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularity([])).toBe(0);
  });

  it('1要素の場合100を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularity([480])).toBe(100);
  });

  it('全て同じ時刻の場合100を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularity([480, 480, 480])).toBe(100);
  });

  it('ばらつきが大きい場合低スコアを返す', () => {
    const score = MedicationRecordEntity.getDoseRegularity([0, 720, 0, 720]);
    expect(score).toBeLessThan(50);
  });

  it('やや均一な時刻の場合中程度のスコアを返す', () => {
    const score = MedicationRecordEntity.getDoseRegularity([480, 490, 470, 485]);
    expect(score).toBeGreaterThan(70);
  });

  it('0-100の範囲に収まる', () => {
    const score = MedicationRecordEntity.getDoseRegularity([0, 1440, 0, 1440]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getDoseRegularityLabel', () => {
  it('80以上は規則的を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularityLabel(80)).toBe('規則的');
  });

  it('50以上80未満はやや不規則を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularityLabel(60)).toBe('やや不規則');
  });

  it('50未満は不規則を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularityLabel(30)).toBe('不規則');
  });

  it('100は規則的を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularityLabel(100)).toBe('規則的');
  });

  it('0は不規則を返す', () => {
    expect(MedicationRecordEntity.getDoseRegularityLabel(0)).toBe('不規則');
  });
});
