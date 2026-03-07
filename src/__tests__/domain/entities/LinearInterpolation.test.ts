import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getLinearInterpolation', () => {
  it('t=0はy1', () => {
    expect(MathHelper.getLinearInterpolation(10, 20, 0)).toBe(10);
  });

  it('t=1はy2', () => {
    expect(MathHelper.getLinearInterpolation(10, 20, 1)).toBe(20);
  });

  it('t=0.5は中間値', () => {
    expect(MathHelper.getLinearInterpolation(0, 100, 0.5)).toBe(50);
  });

  it('t=0.25は1/4の位置', () => {
    expect(MathHelper.getLinearInterpolation(0, 100, 0.25)).toBe(25);
  });

  it('同じ値の場合は常にその値', () => {
    expect(MathHelper.getLinearInterpolation(5, 5, 0.3)).toBe(5);
    expect(MathHelper.getLinearInterpolation(5, 5, 0.7)).toBe(5);
  });

  it('負の値でも動作', () => {
    expect(MathHelper.getLinearInterpolation(-10, 10, 0.5)).toBe(0);
  });

  it('t<0はy1にクランプ', () => {
    expect(MathHelper.getLinearInterpolation(10, 20, -0.5)).toBe(10);
  });

  it('t>1はy2にクランプ', () => {
    expect(MathHelper.getLinearInterpolation(10, 20, 1.5)).toBe(20);
  });

  it('小数第2位まで丸められる', () => {
    const result = MathHelper.getLinearInterpolation(1, 3, 0.33);
    const str = result.toString();
    const decimals = str.split('.')[1];
    expect(!decimals || decimals.length <= 2).toBe(true);
  });

  it('y1 > y2でも動作', () => {
    expect(MathHelper.getLinearInterpolation(100, 0, 0.5)).toBe(50);
  });

  it('大きな値', () => {
    expect(MathHelper.getLinearInterpolation(0, 1000000, 0.5)).toBe(500000);
  });
});

describe('MathHelper.getLinearInterpolationLabel', () => {
  it('0.7以上は上位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.8)).toBe('上位');
  });

  it('0.3以上は中位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.5)).toBe('中位');
  });

  it('0.3未満は下位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.1)).toBe('下位');
  });
});
