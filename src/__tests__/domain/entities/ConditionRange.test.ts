import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionRange', () => {
  it('空配列は0を返す', () => {
    expect(HealthLogEntity.getConditionRange([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(HealthLogEntity.getConditionRange([3])).toBe(0);
  });

  it('全て同じ値は0', () => {
    expect(HealthLogEntity.getConditionRange([3, 3, 3])).toBe(0);
  });

  it('最大値と最小値の差を返す', () => {
    expect(HealthLogEntity.getConditionRange([1, 3, 5])).toBe(4);
  });

  it('2件の差を返す', () => {
    expect(HealthLogEntity.getConditionRange([2, 4])).toBe(2);
  });

  it('順序に関係なく正しいレンジ', () => {
    expect(HealthLogEntity.getConditionRange([5, 1, 3, 2, 4])).toBe(4);
  });

  it('0を含む場合', () => {
    expect(HealthLogEntity.getConditionRange([0, 5])).toBe(5);
  });

  it('負の値を含む場合', () => {
    expect(HealthLogEntity.getConditionRange([-2, 3])).toBe(5);
  });
});

describe('HealthLogEntity.getConditionRangeLabel', () => {
  it('レンジ1以下は安定', () => {
    expect(HealthLogEntity.getConditionRangeLabel(1)).toBe('安定');
  });

  it('レンジ3以下はやや変動', () => {
    expect(HealthLogEntity.getConditionRangeLabel(2)).toBe('やや変動');
  });

  it('レンジ3超は大きな変動', () => {
    expect(HealthLogEntity.getConditionRangeLabel(4)).toBe('大きな変動');
  });
});
