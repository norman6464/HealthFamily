import { describe, it, expect } from 'vitest';
import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity.getGreetingVarietyScore エッジケース', () => {
  it('負の使用種類数は0', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(-5, 10)).toBe(0);
  });

  it('負の全種類数は0', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(5, -10)).toBe(0);
  });

  it('両方負は0', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(-1, -1)).toBe(0);
  });

  it('1種類中1使用は100', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(1, 1)).toBe(100);
  });

  it('使用数が全数を超えても100以下', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(200, 10)).toBeLessThanOrEqual(100);
  });

  it('大きな数値でも動作する', () => {
    const result = GreetingMessageEntity.getGreetingVarietyScore(500, 1000);
    expect(result).toBe(50);
  });

  it('小数の使用数', () => {
    const result = GreetingMessageEntity.getGreetingVarietyScore(2.5, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = GreetingMessageEntity.getGreetingVarietyScore(3, 7);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('3/4は75', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(3, 4)).toBe(75);
  });

  it('1/3は33', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(1, 3)).toBe(33);
  });

  it('全種類数0で使用数正は0', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(5, 0)).toBe(0);
  });

  it('9/10は90', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScore(9, 10)).toBe(90);
  });
});

describe('GreetingMessageEntity.getGreetingVarietyScoreLabel エッジケース', () => {
  it('境界値80は豊富', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(80)).toBe('豊富');
  });

  it('境界値40は普通', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(40)).toBe('普通');
  });

  it('境界値79は普通', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(79)).toBe('普通');
  });

  it('境界値39は少ない', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(39)).toBe('少ない');
  });

  it('0は少ない', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(0)).toBe('少ない');
  });

  it('100は豊富', () => {
    expect(GreetingMessageEntity.getGreetingVarietyScoreLabel(100)).toBe('豊富');
  });
});
