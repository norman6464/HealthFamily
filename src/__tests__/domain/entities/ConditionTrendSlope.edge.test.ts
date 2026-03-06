import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionTrendSlope - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(HealthLogEntity.getConditionTrendSlope([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(HealthLogEntity.getConditionTrendSlope([3])).toBe(0);
  });

  it('2件で上昇は正の傾き', () => {
    expect(HealthLogEntity.getConditionTrendSlope([1, 3])).toBe(2);
  });

  it('2件で下降は負の傾き', () => {
    expect(HealthLogEntity.getConditionTrendSlope([5, 1])).toBe(-4);
  });

  it('2件で同じ値は0', () => {
    expect(HealthLogEntity.getConditionTrendSlope([3, 3])).toBe(0);
  });

  it('完全線形y=xは傾き1', () => {
    expect(HealthLogEntity.getConditionTrendSlope([0, 1, 2, 3, 4])).toBe(1);
  });

  it('完全線形y=-xは傾き-1', () => {
    expect(HealthLogEntity.getConditionTrendSlope([4, 3, 2, 1, 0])).toBe(-1);
  });

  it('V字パターンは傾き0に近い', () => {
    const result = HealthLogEntity.getConditionTrendSlope([5, 3, 1, 3, 5]);
    expect(Math.abs(result)).toBeLessThan(0.5);
  });

  it('逆V字パターンは傾き0に近い', () => {
    const result = HealthLogEntity.getConditionTrendSlope([1, 3, 5, 3, 1]);
    expect(Math.abs(result)).toBeLessThan(0.5);
  });

  it('大量データの線形上昇', () => {
    const values = Array.from({ length: 100 }, (_, i) => i * 0.5);
    const result = HealthLogEntity.getConditionTrendSlope(values);
    expect(result).toBe(0.5);
  });

  it('全て同じ値(大量)は0', () => {
    expect(HealthLogEntity.getConditionTrendSlope(Array(50).fill(3))).toBe(0);
  });

  it('ノイズのある上昇傾向', () => {
    const result = HealthLogEntity.getConditionTrendSlope([1, 3, 2, 4, 3, 5, 4, 6]);
    expect(result).toBeGreaterThan(0);
  });

  it('小数点2桁に丸められる', () => {
    const result = HealthLogEntity.getConditionTrendSlope([1, 2, 4, 3, 5]);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it('負の値を含む配列', () => {
    const result = HealthLogEntity.getConditionTrendSlope([-2, -1, 0, 1, 2]);
    expect(result).toBe(1);
  });
});

describe('HealthLogEntity.getConditionTrendSlopeLabel - 境界値', () => {
  it('傾き0.3は改善傾向(境界値)', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(0.3)).toBe('改善傾向');
  });

  it('傾き0.29は横ばい', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(0.29)).toBe('横ばい');
  });

  it('傾き-0.3は悪化傾向(境界値)', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(-0.3)).toBe('悪化傾向');
  });

  it('傾き-0.29は横ばい', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(-0.29)).toBe('横ばい');
  });

  it('傾き0は横ばい', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(0)).toBe('横ばい');
  });

  it('傾き5は改善傾向', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(5)).toBe('改善傾向');
  });
});
