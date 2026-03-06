import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseConsecutiveScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([])).toBe(0);
  });

  it('1件trueは100', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true])).toBe(100);
  });

  it('1件falseは0', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([false])).toBe(0);
  });

  it('全trueは100', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, true, true, true, true])).toBe(100);
  });

  it('全falseは0', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([false, false, false, false])).toBe(0);
  });

  it('3件中1件trueは33', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, false, false])).toBe(33);
  });

  it('3件中2件trueは67', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, true, false])).toBe(67);
  });

  it('交互パターンは50', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, false, true, false])).toBe(50);
  });

  it('結果は0-100', () => {
    const result = MedicationRecordEntity.getDoseConsecutiveScore([true, false, true, true, false]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i % 2 === 0);
    const result = MedicationRecordEntity.getDoseConsecutiveScore(data);
    expect(result).toBe(50);
  });

  it('先頭のみtrue', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, false, false, false, false])).toBe(20);
  });

  it('末尾のみtrue', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([false, false, false, false, true])).toBe(20);
  });

  it('2件のtrue-false', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, false])).toBe(50);
  });

  it('10件中9件trueは90', () => {
    const data = Array.from({ length: 10 }, (_, i) => i < 9);
    expect(MedicationRecordEntity.getDoseConsecutiveScore(data)).toBe(90);
  });
});

describe('MedicationRecordEntity.getDoseConsecutiveScoreLabel - 境界値', () => {
  it('スコア80は優秀(境界値)', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(80)).toBe('優秀');
  });

  it('スコア79は良好', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(79)).toBe('良好');
  });

  it('スコア50は良好(境界値)', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(50)).toBe('良好');
  });

  it('スコア49は要改善', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(49)).toBe('要改善');
  });

  it('スコア0は要改善', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(0)).toBe('要改善');
  });

  it('スコア100は優秀', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(100)).toBe('優秀');
  });
});
