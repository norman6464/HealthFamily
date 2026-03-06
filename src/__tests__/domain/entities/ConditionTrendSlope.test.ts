import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionTrendSlope', () => {
  it('空配列は0を返す', () => {
    expect(HealthLogEntity.getConditionTrendSlope([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(HealthLogEntity.getConditionTrendSlope([3])).toBe(0);
  });

  it('全て同じ値は0を返す', () => {
    expect(HealthLogEntity.getConditionTrendSlope([3, 3, 3, 3])).toBe(0);
  });

  it('上昇傾向は正の値', () => {
    expect(HealthLogEntity.getConditionTrendSlope([1, 2, 3, 4, 5])).toBeGreaterThan(0);
  });

  it('下降傾向は負の値', () => {
    expect(HealthLogEntity.getConditionTrendSlope([5, 4, 3, 2, 1])).toBeLessThan(0);
  });

  it('完全な線形上昇の傾きは1', () => {
    expect(HealthLogEntity.getConditionTrendSlope([1, 2, 3, 4, 5])).toBe(1);
  });

  it('完全な線形下降の傾きは-1', () => {
    expect(HealthLogEntity.getConditionTrendSlope([5, 4, 3, 2, 1])).toBe(-1);
  });

  it('ノイズがある上昇傾向も正の値', () => {
    const result = HealthLogEntity.getConditionTrendSlope([1, 3, 2, 4, 3, 5]);
    expect(result).toBeGreaterThan(0);
  });

  it('小数点2桁に丸められる', () => {
    const result = HealthLogEntity.getConditionTrendSlope([1, 3, 2, 5]);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });
});

describe('HealthLogEntity.getConditionTrendSlopeLabel', () => {
  it('傾き0.3以上は改善傾向', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(0.5)).toBe('改善傾向');
  });

  it('傾き-0.3以下は悪化傾向', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(-0.5)).toBe('悪化傾向');
  });

  it('傾き0は横ばい', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(0)).toBe('横ばい');
  });

  it('傾き0.2は横ばい', () => {
    expect(HealthLogEntity.getConditionTrendSlopeLabel(0.2)).toBe('横ばい');
  });
});
