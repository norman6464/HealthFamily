import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity.getMemberEngagementScore - エッジケース', () => {
  it('全て0は0', () => {
    expect(MemberEntity.getMemberEngagementScore(0, 0, 0)).toBe(0);
  });

  it('全て100は100', () => {
    expect(MemberEntity.getMemberEngagementScore(100, 100, 100)).toBe(100);
  });

  it('ログインのみ100', () => {
    expect(MemberEntity.getMemberEngagementScore(100, 0, 0)).toBe(30);
  });

  it('記録のみ100', () => {
    expect(MemberEntity.getMemberEngagementScore(0, 100, 0)).toBe(40);
  });

  it('遵守のみ100', () => {
    expect(MemberEntity.getMemberEngagementScore(0, 0, 100)).toBe(30);
  });

  it('負の値は0扱い', () => {
    expect(MemberEntity.getMemberEngagementScore(-50, -50, -50)).toBe(0);
  });

  it('超過値は100扱い', () => {
    expect(MemberEntity.getMemberEngagementScore(200, 200, 200)).toBe(100);
  });

  it('中程度の値', () => {
    const result = MemberEntity.getMemberEngagementScore(50, 50, 50);
    expect(result).toBe(50);
  });

  it('記録率が最も重い', () => {
    const highRecord = MemberEntity.getMemberEngagementScore(50, 100, 50);
    const highLogin = MemberEntity.getMemberEngagementScore(100, 50, 50);
    expect(highRecord).toBeGreaterThan(highLogin);
  });

  it('結果は0-100の範囲', () => {
    const result = MemberEntity.getMemberEngagementScore(60, 70, 40);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('各要素が高いほどスコアが高い', () => {
    const low = MemberEntity.getMemberEngagementScore(20, 20, 20);
    const high = MemberEntity.getMemberEngagementScore(80, 80, 80);
    expect(high).toBeGreaterThan(low);
  });
});

describe('MemberEntity.getMemberEngagementScoreLabel - エッジケース', () => {
  it('100は積極的', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(100)).toBe('積極的');
  });

  it('80は積極的', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(80)).toBe('積極的');
  });

  it('79は普通', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(79)).toBe('普通');
  });

  it('50は普通', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(50)).toBe('普通');
  });

  it('49は消極的', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(49)).toBe('消極的');
  });

  it('0は消極的', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(0)).toBe('消極的');
  });
});
