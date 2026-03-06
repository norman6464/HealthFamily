import { describe, it, expect } from 'vitest';
import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity.getGreetingIntensityScore', () => {
  it('0時間・0ストリークは0', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScore(0, 0)).toBe(0);
  });

  it('長時間離脱はスコアが高い', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(48, 0);
    expect(result).toBeGreaterThan(30);
  });

  it('ストリークが高いとスコアが高い', () => {
    const low = GreetingMessageEntity.getGreetingIntensityScore(24, 1);
    const high = GreetingMessageEntity.getGreetingIntensityScore(24, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('短時間はスコアが低い', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(1, 0);
    expect(result).toBeLessThan(30);
  });

  it('結果は0-100の範囲', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(24, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('最大値は100を超えない', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScore(1000, 100)).toBeLessThanOrEqual(100);
  });

  it('時間が長いほどスコアが高い', () => {
    const short = GreetingMessageEntity.getGreetingIntensityScore(1, 5);
    const long = GreetingMessageEntity.getGreetingIntensityScore(72, 5);
    expect(long).toBeGreaterThan(short);
  });

  it('24時間・ストリーク7', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(24, 7);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('GreetingMessageEntity.getGreetingIntensityScoreLabel', () => {
  it('スコア高は熱烈', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(80)).toBe('熱烈');
  });

  it('スコア中は普通', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(50)).toBe('普通');
  });

  it('スコア低は軽め', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(20)).toBe('軽め');
  });
});
