import { describe, it, expect } from 'vitest';
import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity.getGreetingVarietyScore', () => {
  it('0種類は0', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(0, 10)).toBe(0);
  });

  it('使用種類=全種類は100', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(10, 10)).toBe(100);
  });

  it('全種類0は0', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(0, 0)).toBe(0);
  });

  it('半分は50', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(5, 10)).toBe(50);
  });

  it('使用が多いほどスコアが高い', () => {
    const low = GreetingMessageEntity.getGreetingVarietyScore(2, 10);
    const high = GreetingMessageEntity.getGreetingVarietyScore(8, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = GreetingMessageEntity.getGreetingVarietyScore(3, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(20, 10)).toBeLessThanOrEqual(100);
  });
});

describe('GreetingMessageEntity.getGreetingVarietyScoreLabel', () => {
  it('スコア高は豊富', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(85)).toBe('豊富');
  });

  it('スコア中は普通', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(55)).toBe('普通');
  });

  it('スコア低は少ない', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(25)).toBe('少ない');
  });
});
