import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getCosineSimilarity - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getCosineSimilarity([], [])).toBe(0);
  });

  it('片方が空の場合0を返す', () => {
    expect(MathHelper.getCosineSimilarity([1, 2], [])).toBe(0);
  });

  it('1要素で同じ値は1', () => {
    expect(MathHelper.getCosineSimilarity([5], [5])).toBe(1);
  });

  it('1要素で正反対は-1', () => {
    expect(MathHelper.getCosineSimilarity([5], [-5])).toBe(-1);
  });

  it('両方ゼロベクトルは0', () => {
    expect(MathHelper.getCosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('片方がゼロベクトルは0', () => {
    expect(MathHelper.getCosineSimilarity([0, 0], [1, 2])).toBe(0);
  });

  it('スカラー倍(正)は1', () => {
    expect(MathHelper.getCosineSimilarity([1, 2, 3], [10, 20, 30])).toBe(1);
  });

  it('スカラー倍(負)は-1', () => {
    expect(MathHelper.getCosineSimilarity([1, 2, 3], [-10, -20, -30])).toBe(-1);
  });

  it('直交ベクトルは0', () => {
    expect(MathHelper.getCosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0);
  });

  it('長さの異なる配列は短い方に合わせる', () => {
    const result = MathHelper.getCosineSimilarity([1, 0, 0], [1, 0]);
    expect(result).toBe(1);
  });

  it('大きな値でも-1から1の範囲内', () => {
    const result = MathHelper.getCosineSimilarity([1000000, 2000000], [3000000, 1000000]);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('負の値を含む配列', () => {
    const result = MathHelper.getCosineSimilarity([-1, 2, -3], [1, -2, 3]);
    expect(result).toBe(-1);
  });

  it('小数点2桁に丸められる', () => {
    const result = MathHelper.getCosineSimilarity([1, 2, 3], [4, 5, 6]);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });
});

describe('MathHelper.getCosineSimilarityLabel - 境界値', () => {
  it('類似度0.7は類似(境界値)', () => {
    expect(MathHelper.getCosineSimilarityLabel(0.7)).toBe('類似');
  });

  it('類似度0.69はやや類似', () => {
    expect(MathHelper.getCosineSimilarityLabel(0.69)).toBe('やや類似');
  });

  it('類似度0.3はやや類似(境界値)', () => {
    expect(MathHelper.getCosineSimilarityLabel(0.3)).toBe('やや類似');
  });

  it('類似度0.29は無関係', () => {
    expect(MathHelper.getCosineSimilarityLabel(0.29)).toBe('無関係');
  });

  it('類似度-0.7は正反対(境界値)', () => {
    expect(MathHelper.getCosineSimilarityLabel(-0.7)).toBe('正反対');
  });

  it('類似度-0.69は無関係', () => {
    expect(MathHelper.getCosineSimilarityLabel(-0.69)).toBe('無関係');
  });

  it('類似度1は類似', () => {
    expect(MathHelper.getCosineSimilarityLabel(1)).toBe('類似');
  });

  it('類似度-1は正反対', () => {
    expect(MathHelper.getCosineSimilarityLabel(-1)).toBe('正反対');
  });
});
