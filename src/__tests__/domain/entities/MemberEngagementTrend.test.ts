import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity.getMemberEngagementTrend', () => {
  it('空配列は0', () => {
    expect(MemberEntity.getMemberEngagementTrend([])).toBe(0);
  });

  it('1要素は0', () => {
    expect(MemberEntity.getMemberEngagementTrend([5])).toBe(0);
  });

  it('増加傾向は正の値', () => {
    const result = MemberEntity.getMemberEngagementTrend([1, 2, 3, 4, 5, 6]);
    expect(result).toBeGreaterThan(0);
  });

  it('減少傾向は負の値', () => {
    const result = MemberEntity.getMemberEngagementTrend([6, 5, 4, 3, 2, 1]);
    expect(result).toBeLessThan(0);
  });

  it('一定は0', () => {
    expect(MemberEntity.getMemberEngagementTrend([5, 5, 5, 5])).toBe(0);
  });

  it('結果は-100から100の範囲', () => {
    const result = MemberEntity.getMemberEngagementTrend([10, 1, 8, 3, 7, 2]);
    expect(result).toBeGreaterThanOrEqual(-100);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MemberEntity.getMemberEngagementTrend([3, 5, 2, 7, 1, 8]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('前半0で後半に記録は正', () => {
    const result = MemberEntity.getMemberEngagementTrend([0, 0, 5, 5]);
    expect(result).toBeGreaterThan(0);
  });

  it('前半に記録で後半0は負', () => {
    const result = MemberEntity.getMemberEngagementTrend([5, 5, 0, 0]);
    expect(result).toBeLessThan(0);
  });

  it('急増は高い正の値', () => {
    const result = MemberEntity.getMemberEngagementTrend([1, 1, 10, 10]);
    expect(result).toBeGreaterThan(50);
  });

  it('2要素で増加', () => {
    const result = MemberEntity.getMemberEngagementTrend([1, 5]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MemberEntity.getMemberEngagementTrendLabel', () => {
  it('正の値は上昇', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(30)).toBe('上昇');
  });

  it('0は横ばい', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(0)).toBe('横ばい');
  });

  it('負の値は下降', () => {
    expect(MemberEntity.getMemberEngagementTrendLabel(-20)).toBe('下降');
  });
});
