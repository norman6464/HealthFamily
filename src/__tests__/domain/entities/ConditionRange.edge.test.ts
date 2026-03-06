import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionRange - エッジケース', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getConditionRange([])).toBe(0);
  });

  it('1件は0', () => {
    expect(HealthLogEntity.getConditionRange([3])).toBe(0);
  });

  it('2件の同じ値は0', () => {
    expect(HealthLogEntity.getConditionRange([3, 3])).toBe(0);
  });

  it('2件の異なる値', () => {
    expect(HealthLogEntity.getConditionRange([1, 5])).toBe(4);
  });

  it('全て同じ値は0(長い配列)', () => {
    expect(HealthLogEntity.getConditionRange([3, 3, 3, 3, 3])).toBe(0);
  });

  it('最大レンジ(1-5)', () => {
    expect(HealthLogEntity.getConditionRange([1, 2, 3, 4, 5])).toBe(4);
  });

  it('逆順でも同じ結果', () => {
    expect(HealthLogEntity.getConditionRange([5, 4, 3, 2, 1])).toBe(4);
  });

  it('最小と最大が隣接', () => {
    expect(HealthLogEntity.getConditionRange([1, 2])).toBe(1);
  });

  it('0を含む場合', () => {
    expect(HealthLogEntity.getConditionRange([0, 5])).toBe(5);
  });

  it('負の値を含む場合', () => {
    expect(HealthLogEntity.getConditionRange([-3, 3])).toBe(6);
  });

  it('小数値', () => {
    expect(HealthLogEntity.getConditionRange([1.5, 3.5])).toBe(2);
  });

  it('大量データでも正しく計算', () => {
    const data = Array.from({ length: 100 }, (_, i) => (i % 5) + 1);
    expect(HealthLogEntity.getConditionRange(data)).toBe(4);
  });

  it('最大値が先頭にある場合', () => {
    expect(HealthLogEntity.getConditionRange([5, 1, 2, 3])).toBe(4);
  });

  it('最小値が末尾にある場合', () => {
    expect(HealthLogEntity.getConditionRange([3, 4, 5, 1])).toBe(4);
  });

  it('レンジは必ず0以上', () => {
    const result = HealthLogEntity.getConditionRange([3, 1, 4, 1, 5]);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('HealthLogEntity.getConditionRangeLabel - 境界値', () => {
  it('レンジ0は安定', () => {
    expect(HealthLogEntity.getConditionRangeLabel(0)).toBe('安定');
  });

  it('レンジ1は安定(境界値)', () => {
    expect(HealthLogEntity.getConditionRangeLabel(1)).toBe('安定');
  });

  it('レンジ2はやや変動', () => {
    expect(HealthLogEntity.getConditionRangeLabel(2)).toBe('やや変動');
  });

  it('レンジ3はやや変動(境界値)', () => {
    expect(HealthLogEntity.getConditionRangeLabel(3)).toBe('やや変動');
  });

  it('レンジ4は大きな変動', () => {
    expect(HealthLogEntity.getConditionRangeLabel(4)).toBe('大きな変動');
  });

  it('レンジ10は大きな変動', () => {
    expect(HealthLogEntity.getConditionRangeLabel(10)).toBe('大きな変動');
  });
});
