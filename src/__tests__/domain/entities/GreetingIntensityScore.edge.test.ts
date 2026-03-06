import { describe, it, expect } from 'vitest';
import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity.getGreetingIntensityScore - エッジケース', () => {
  it('両方0は0', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScore(0, 0)).toBe(0);
  });

  it('時間0・ストリークありはストリーク分のみ', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(0, 15);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('時間あり・ストリーク0は時間分のみ', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(36, 0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('最大時間・最大ストリークは100', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScore(72, 30)).toBe(100);
  });

  it('超過しても100', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScore(200, 100)).toBe(100);
  });

  it('1時間は低い', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(1, 0);
    expect(result).toBeLessThan(10);
  });

  it('時間が長いほどスコアが高い', () => {
    const short = GreetingMessageEntity.getGreetingIntensityScore(1, 5);
    const long = GreetingMessageEntity.getGreetingIntensityScore(60, 5);
    expect(long).toBeGreaterThan(short);
  });

  it('ストリークが多いほどスコアが高い', () => {
    const low = GreetingMessageEntity.getGreetingIntensityScore(24, 1);
    const high = GreetingMessageEntity.getGreetingIntensityScore(24, 25);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(12, 7);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('ちょうど半分の入力', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(36, 15);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(70);
  });

  it('24時間・ストリーク0', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(24, 0);
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(50);
  });

  it('0時間・ストリーク30', () => {
    const result = GreetingMessageEntity.getGreetingIntensityScore(0, 30);
    expect(result).toBe(40);
  });
});

describe('GreetingMessageEntity.getGreetingIntensityScoreLabel - エッジケース', () => {
  it('スコア100は熱烈', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(100)).toBe('熱烈');
  });

  it('スコア70は熱烈', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(70)).toBe('熱烈');
  });

  it('スコア69は普通', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(69)).toBe('普通');
  });

  it('スコア40は普通', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(40)).toBe('普通');
  });

  it('スコア39は軽め', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(39)).toBe('軽め');
  });

  it('スコア0は軽め', () => {
    expect(GreetingMessageEntity.getGreetingIntensityScoreLabel(0)).toBe('軽め');
  });
});
