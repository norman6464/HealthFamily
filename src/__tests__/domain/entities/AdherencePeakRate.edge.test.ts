import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherencePeakRate - エッジケース', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([])).toBe(0);
  });

  it('1件はその値', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([42])).toBe(42);
  });

  it('全て0は0', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([0, 0, 0])).toBe(0);
  });

  it('全て100は100', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([100, 100, 100])).toBe(100);
  });

  it('昇順の最後が最大', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([10, 20, 30, 40, 50])).toBe(50);
  });

  it('降順の最初が最大', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([50, 40, 30, 20, 10])).toBe(50);
  });

  it('中間に最大値がある場合', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([10, 50, 95, 30, 20])).toBe(95);
  });

  it('負の値を含む場合は最大値を返す', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([-10, 0, 50])).toBe(50);
  });

  it('全て負の値', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([-30, -20, -10])).toBe(-10);
  });

  it('小数値', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([33.3, 66.6, 99.9])).toBe(99.9);
  });

  it('大量データでも最大値を返す', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    expect(AdherenceTrendEntity.getAdherencePeakRate(data)).toBe(99);
  });

  it('最大値が複数あっても正しく返す', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([80, 80, 80])).toBe(80);
  });

  it('0と100のみ', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([0, 100])).toBe(100);
  });

  it('1と99', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([1, 99])).toBe(99);
  });
});

describe('AdherenceTrendEntity.getAdherencePeakLabel - 境界値', () => {
  it('ピーク率90は優秀(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(90)).toBe('優秀');
  });

  it('ピーク率89は良好', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(89)).toBe('良好');
  });

  it('ピーク率70は良好(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(70)).toBe('良好');
  });

  it('ピーク率69は普通', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(69)).toBe('普通');
  });

  it('ピーク率50は普通(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(50)).toBe('普通');
  });

  it('ピーク率49は低調', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(49)).toBe('低調');
  });

  it('ピーク率0は低調', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(0)).toBe('低調');
  });

  it('ピーク率100は優秀', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(100)).toBe('優秀');
  });
});
