import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getLinearInterpolation エッジケース', () => {
  it('t=0は常にy1', () => {
    expect(MathHelper.getLinearInterpolation(100, 200, 0)).toBe(100);
    expect(MathHelper.getLinearInterpolation(-50, 50, 0)).toBe(-50);
  });

  it('t=1は常にy2', () => {
    expect(MathHelper.getLinearInterpolation(100, 200, 1)).toBe(200);
    expect(MathHelper.getLinearInterpolation(-50, 50, 1)).toBe(50);
  });

  it('y1=y2の場合は常にその値', () => {
    for (let t = 0; t <= 1; t += 0.25) {
      expect(MathHelper.getLinearInterpolation(42, 42, t)).toBe(42);
    }
  });

  it('t=-1はy1にクランプ', () => {
    expect(MathHelper.getLinearInterpolation(10, 20, -1)).toBe(10);
  });

  it('t=2はy2にクランプ', () => {
    expect(MathHelper.getLinearInterpolation(10, 20, 2)).toBe(20);
  });

  it('非常に大きな値', () => {
    expect(MathHelper.getLinearInterpolation(0, 1000000, 0.5)).toBe(500000);
  });

  it('非常に小さな値', () => {
    expect(MathHelper.getLinearInterpolation(0, 0.01, 0.5)).toBe(0.01);
  });

  it('両方負の値', () => {
    expect(MathHelper.getLinearInterpolation(-100, -50, 0.5)).toBe(-75);
  });

  it('y1 > y2でも正しく補間', () => {
    expect(MathHelper.getLinearInterpolation(100, 0, 0.25)).toBe(75);
  });

  it('t=0.1で正確な計算', () => {
    expect(MathHelper.getLinearInterpolation(0, 100, 0.1)).toBe(10);
  });

  it('t=0.9で正確な計算', () => {
    expect(MathHelper.getLinearInterpolation(0, 100, 0.9)).toBe(90);
  });

  it('小数第2位まで丸められる', () => {
    const result = MathHelper.getLinearInterpolation(0, 3, 0.33);
    const str = result.toString();
    const decimals = str.split('.')[1];
    expect(!decimals || decimals.length <= 2).toBe(true);
  });

  it('0と0の補間は常に0', () => {
    expect(MathHelper.getLinearInterpolation(0, 0, 0.5)).toBe(0);
  });

  it('t=0.75で3/4の位置', () => {
    expect(MathHelper.getLinearInterpolation(0, 100, 0.75)).toBe(75);
  });
});

describe('MathHelper.getLinearInterpolationLabel エッジケース', () => {
  it('境界値0.7は上位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.7)).toBe('上位');
  });

  it('境界値0.3は中位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.3)).toBe('中位');
  });

  it('境界値0.69は中位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.69)).toBe('中位');
  });

  it('境界値0.29は下位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0.29)).toBe('下位');
  });

  it('0は下位', () => {
    expect(MathHelper.getLinearInterpolationLabel(0)).toBe('下位');
  });

  it('1は上位', () => {
    expect(MathHelper.getLinearInterpolationLabel(1)).toBe('上位');
  });
});
