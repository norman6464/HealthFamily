import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity.getMemberCareScore', () => {
  it('両方0は0', () => {
    expect(MemberEntity.getMemberCareScore(0, 0)).toBe(0);
  });

  it('両方100は100', () => {
    expect(MemberEntity.getMemberCareScore(100, 100)).toBe(100);
  });

  it('服薬率のみ高い', () => {
    const result = MemberEntity.getMemberCareScore(100, 0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('記録率のみ高い', () => {
    const result = MemberEntity.getMemberCareScore(0, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('中程度の値', () => {
    const result = MemberEntity.getMemberCareScore(50, 50);
    expect(result).toBe(50);
  });

  it('結果は0-100の範囲', () => {
    const result = MemberEntity.getMemberCareScore(70, 80);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('服薬率が高いほどスコアが高い', () => {
    const low = MemberEntity.getMemberCareScore(20, 50);
    const high = MemberEntity.getMemberCareScore(80, 50);
    expect(high).toBeGreaterThan(low);
  });

  it('記録率が高いほどスコアが高い', () => {
    const low = MemberEntity.getMemberCareScore(50, 20);
    const high = MemberEntity.getMemberCareScore(50, 80);
    expect(high).toBeGreaterThan(low);
  });

  it('100超えは100', () => {
    expect(MemberEntity.getMemberCareScore(150, 150)).toBe(100);
  });
});

describe('MemberEntity.getMemberCareScoreLabel', () => {
  it('スコア高は良好', () => {
    expect(MemberEntity.getMemberCareScoreLabel(85)).toBe('良好');
  });

  it('スコア中は普通', () => {
    expect(MemberEntity.getMemberCareScoreLabel(60)).toBe('普通');
  });

  it('スコア低は要注意', () => {
    expect(MemberEntity.getMemberCareScoreLabel(30)).toBe('要注意');
  });
});
