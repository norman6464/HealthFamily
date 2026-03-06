import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getCoeffOfVariation', () => {
  it('空配列は0', () => {
    expect(MathHelper.getCoeffOfVariation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getCoeffOfVariation([50])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getCoeffOfVariation([50, 50, 50])).toBe(0);
  });

  it('ばらつきがあると正値', () => {
    const result = MathHelper.getCoeffOfVariation([10, 20, 30]);
    expect(result).toBeGreaterThan(0);
  });

  it('ばらつきが大きいほど高い', () => {
    const small = MathHelper.getCoeffOfVariation([48, 50, 52]);
    const large = MathHelper.getCoeffOfVariation([10, 50, 90]);
    expect(large).toBeGreaterThan(small);
  });

  it('平均0の場合は0', () => {
    expect(MathHelper.getCoeffOfVariation([0, 0, 0])).toBe(0);
  });

  it('結果は非負', () => {
    const result = MathHelper.getCoeffOfVariation([5, 10, 15, 20]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = MathHelper.getCoeffOfVariation(data);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getCoeffOfVariationLabel', () => {
  it('CV 20未満は安定', () => {
    expect(MathHelper.getCoeffOfVariationLabel(15)).toBe('安定');
  });

  it('CV 20-50はやや変動', () => {
    expect(MathHelper.getCoeffOfVariationLabel(30)).toBe('やや変動');
  });

  it('CV 50以上は変動大', () => {
    expect(MathHelper.getCoeffOfVariationLabel(60)).toBe('変動大');
  });
});
