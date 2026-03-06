import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getExponentialDecay - エッジケース', () => {
  it('初期値0は常に0', () => {
    expect(MathHelper.getExponentialDecay(0, 10, 0.5)).toBe(0);
  });

  it('時間0は初期値', () => {
    expect(MathHelper.getExponentialDecay(100, 0, 0.5)).toBe(100);
  });

  it('減衰率0は初期値', () => {
    expect(MathHelper.getExponentialDecay(100, 100, 0)).toBe(100);
  });

  it('時間1・減衰率1', () => {
    const result = MathHelper.getExponentialDecay(100, 1, 1);
    expect(result).toBeCloseTo(36.79, 0);
  });

  it('大きな時間で0に近づく', () => {
    const result = MathHelper.getExponentialDecay(100, 100, 1);
    expect(result).toBeLessThan(0.01);
  });

  it('小さな減衰率では緩やかに減少', () => {
    const result = MathHelper.getExponentialDecay(100, 1, 0.01);
    expect(result).toBeGreaterThanOrEqual(99);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getExponentialDecay(50, 50, 0.5);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('結果は初期値以下', () => {
    const result = MathHelper.getExponentialDecay(80, 5, 0.3);
    expect(result).toBeLessThanOrEqual(80);
  });

  it('初期値が大きいほど結果も大きい', () => {
    const small = MathHelper.getExponentialDecay(50, 5, 0.1);
    const large = MathHelper.getExponentialDecay(100, 5, 0.1);
    expect(large).toBeGreaterThan(small);
  });

  it('減衰率が大きいほど結果が小さい', () => {
    const slow = MathHelper.getExponentialDecay(100, 5, 0.1);
    const fast = MathHelper.getExponentialDecay(100, 5, 1);
    expect(fast).toBeLessThan(slow);
  });

  it('半減期の確認', () => {
    const result = MathHelper.getExponentialDecay(100, 1, Math.LN2);
    expect(result).toBeCloseTo(50, 0);
  });
});

describe('MathHelper.getExponentialDecayLabel - エッジケース', () => {
  it('100は有効', () => {
    expect(MathHelper.getExponentialDecayLabel(100)).toBe('有効');
  });

  it('60は有効', () => {
    expect(MathHelper.getExponentialDecayLabel(60)).toBe('有効');
  });

  it('59はやや減衰', () => {
    expect(MathHelper.getExponentialDecayLabel(59)).toBe('やや減衰');
  });

  it('30はやや減衰', () => {
    expect(MathHelper.getExponentialDecayLabel(30)).toBe('やや減衰');
  });

  it('29は減衰大', () => {
    expect(MathHelper.getExponentialDecayLabel(29)).toBe('減衰大');
  });

  it('0は減衰大', () => {
    expect(MathHelper.getExponentialDecayLabel(0)).toBe('減衰大');
  });
});
