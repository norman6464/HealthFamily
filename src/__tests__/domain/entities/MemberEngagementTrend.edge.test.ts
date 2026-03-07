import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity.getMemberEngagementTrend エッジケース', () => {
  it('2要素で増加', () => {
    const result = MemberEntity.getMemberEngagementTrend([1, 10]);
    expect(result).toBeGreaterThan(0);
  });

  it('2要素で減少', () => {
    const result = MemberEntity.getMemberEngagementTrend([10, 1]);
    expect(result).toBeLessThan(0);
  });

  it('2要素で同値は0', () => {
    expect(MemberEntity.getMemberEngagementTrend([5, 5])).toBe(0);
  });

  it('全て0は0', () => {
    expect(MemberEntity.getMemberEngagementTrend([0, 0, 0, 0])).toBe(0);
  });

  it('前半0で後半正は正', () => {
    const result = MemberEntity.getMemberEngagementTrend([0, 0, 0, 10, 10, 10]);
    expect(result).toBeGreaterThan(0);
  });

  it('前半正で後半0は負', () => {
    const result = MemberEntity.getMemberEngagementTrend([10, 10, 10, 0, 0, 0]);
    expect(result).toBeLessThan(0);
  });

  it('結果は-100から100', () => {
    const result = MemberEntity.getMemberEngagementTrend([100, 1, 50, 30, 80, 5]);
    expect(result).toBeGreaterThanOrEqual(-100);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MemberEntity.getMemberEngagementTrend([3, 7, 2, 8, 5, 1]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('多数の要素で安定', () => {
    const counts = Array.from({ length: 20 }, () => 5);
    expect(MemberEntity.getMemberEngagementTrend(counts)).toBe(0);
  });

  it('多数の要素で増加', () => {
    const counts = Array.from({ length: 20 }, (_, i) => i);
    const result = MemberEntity.getMemberEngagementTrend(counts);
    expect(result).toBeGreaterThan(0);
  });

  it('小数値', () => {
    const result = MemberEntity.getMemberEngagementTrend([0.5, 1.5, 2.5, 3.5]);
    expect(result).toBeGreaterThan(0);
  });

  it('非常に大きな値', () => {
    const result = MemberEntity.getMemberEngagementTrend([1000000, 1000000, 1000000, 1000000]);
    expect(result).toBe(0);
  });

  it('奇数要素の分割', () => {
    const result = MemberEntity.getMemberEngagementTrend([1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThan(0);
  });

  it('3要素', () => {
    const result = MemberEntity.getMemberEngagementTrend([1, 5, 10]);
    expect(result).toBeGreaterThan(0);
  });

  it('急激な変化', () => {
    const result = MemberEntity.getMemberEngagementTrend([0, 0, 100, 100]);
    expect(result).toBe(100);
  });

  it('逆方向の急激な変化', () => {
    const result = MemberEntity.getMemberEngagementTrend([100, 100, 0, 0]);
    expect(result).toBe(-100);
  });

  it('V字パターン', () => {
    const result = MemberEntity.getMemberEngagementTrend([10, 5, 1, 5, 10]);
    expect(result).toBeGreaterThanOrEqual(-100);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MemberEntity.getMemberEngagementTrendLabel エッジケース', () => {
  it('1は上昇', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(1)).toBe('上昇');
  });

  it('-1は下降', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(-1)).toBe('下降');
  });

  it('0は横ばい', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(0)).toBe('横ばい');
  });

  it('100は上昇', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(100)).toBe('上昇');
  });

  it('-100は下降', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(-100)).toBe('下降');
  });
});
