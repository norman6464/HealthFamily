import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity.getMemberCareScore - エッジケース', () => {
  it('両方0は0', () => {
    expect(MemberEntity.getMemberCareScore(0, 0)).toBe(0);
  });

  it('両方100は100', () => {
    expect(MemberEntity.getMemberCareScore(100, 100)).toBe(100);
  });

  it('服薬率100・記録率0', () => {
    expect(MemberEntity.getMemberCareScore(100, 0)).toBe(60);
  });

  it('服薬率0・記録率100', () => {
    expect(MemberEntity.getMemberCareScore(0, 100)).toBe(40);
  });

  it('両方50は50', () => {
    expect(MemberEntity.getMemberCareScore(50, 50)).toBe(50);
  });

  it('負の服薬率は0扱い', () => {
    expect(MemberEntity.getMemberCareScore(-10, 50)).toBe(20);
  });

  it('負の記録率は0扱い', () => {
    expect(MemberEntity.getMemberCareScore(50, -10)).toBe(30);
  });

  it('100超えの服薬率は100扱い', () => {
    expect(MemberEntity.getMemberCareScore(150, 50)).toBe(80);
  });

  it('100超えの記録率は100扱い', () => {
    expect(MemberEntity.getMemberCareScore(50, 150)).toBe(70);
  });

  it('両方100超えは100', () => {
    expect(MemberEntity.getMemberCareScore(200, 200)).toBe(100);
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

  it('結果は0-100の範囲', () => {
    const result = MemberEntity.getMemberCareScore(70, 60);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MemberEntity.getMemberCareScoreLabel - エッジケース', () => {
  it('スコア100は良好', () => {
    expect(MemberEntity.getMemberCareScoreLabel(100)).toBe('良好');
  });

  it('スコア80は良好', () => {
    expect(MemberEntity.getMemberCareScoreLabel(80)).toBe('良好');
  });

  it('スコア79は普通', () => {
    expect(MemberEntity.getMemberCareScoreLabel(79)).toBe('普通');
  });

  it('スコア50は普通', () => {
    expect(MemberEntity.getMemberCareScoreLabel(50)).toBe('普通');
  });

  it('スコア49は要注意', () => {
    expect(MemberEntity.getMemberCareScoreLabel(49)).toBe('要注意');
  });

  it('スコア0は要注意', () => {
    expect(MemberEntity.getMemberCareScoreLabel(0)).toBe('要注意');
  });
});
