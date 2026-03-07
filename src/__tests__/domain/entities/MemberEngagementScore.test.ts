import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity.getMemberEngagementScore', () => {
  it('全て0は0', () => {
    expect(MemberEntity.getMemberEngagementScore(0, 0, 0)).toBe(0);
  });

  it('全て100は100', () => {
    expect(MemberEntity.getMemberEngagementScore(100, 100, 100)).toBe(100);
  });

  it('ログイン率のみ高い', () => {
    const result = MemberEntity.getMemberEngagementScore(100, 0, 0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(60);
  });

  it('ログイン率が高いほどスコアが高い', () => {
    const low = MemberEntity.getMemberEngagementScore(20, 50, 50);
    const high = MemberEntity.getMemberEngagementScore(80, 50, 50);
    expect(high).toBeGreaterThan(low);
  });

  it('記録率が高いほどスコアが高い', () => {
    const low = MemberEntity.getMemberEngagementScore(50, 20, 50);
    const high = MemberEntity.getMemberEngagementScore(50, 80, 50);
    expect(high).toBeGreaterThan(low);
  });

  it('遵守率が高いほどスコアが高い', () => {
    const low = MemberEntity.getMemberEngagementScore(50, 50, 20);
    const high = MemberEntity.getMemberEngagementScore(50, 50, 80);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = MemberEntity.getMemberEngagementScore(60, 70, 50);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(MemberEntity.getMemberEngagementScore(150, 150, 150)).toBeLessThanOrEqual(100);
  });
});

describe('MemberEntity.getMemberEngagementScoreLabel', () => {
  it('スコア高は積極的', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(85)).toBe('積極的');
  });

  it('スコア中は普通', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(55)).toBe('普通');
  });

  it('スコア低は消極的', () => {
    expect(MemberEntity.getMemberEngagementScoreLabel(25)).toBe('消極的');
  });
});
