import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getExponentialDecay', () => {
  it('時間0は初期値そのまま', () => {
    expect(MathHelper.getExponentialDecay(100, 0, 0.1)).toBe(100);
  });

  it('時間が増えると値が減る', () => {
    const early = MathHelper.getExponentialDecay(100, 1, 0.1);
    const late = MathHelper.getExponentialDecay(100, 10, 0.1);
    expect(late).toBeLessThan(early);
  });

  it('初期値0は常に0', () => {
    expect(MathHelper.getExponentialDecay(0, 5, 0.1)).toBe(0);
  });

  it('減衰率0は初期値のまま', () => {
    expect(MathHelper.getExponentialDecay(100, 10, 0)).toBe(100);
  });

  it('大きな減衰率で急速減衰', () => {
    const result = MathHelper.getExponentialDecay(100, 10, 1);
    expect(result).toBeLessThan(1);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getExponentialDecay(100, 100, 0.5);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('結果は初期値以下', () => {
    const result = MathHelper.getExponentialDecay(50, 5, 0.2);
    expect(result).toBeLessThanOrEqual(50);
  });

  it('半減期の確認', () => {
    const result = MathHelper.getExponentialDecay(100, 1, Math.LN2);
    expect(result).toBeCloseTo(50, 0);
  });
});

describe('MathHelper.getExponentialDecayLabel', () => {
  it('値高は有効', () => {
    expect(MathHelper.getExponentialDecayLabel(80)).toBe('有効');
  });

  it('値中はやや減衰', () => {
    expect(MathHelper.getExponentialDecayLabel(40)).toBe('やや減衰');
  });

  it('値低は減衰大', () => {
    expect(MathHelper.getExponentialDecayLabel(15)).toBe('減衰大');
  });
});
