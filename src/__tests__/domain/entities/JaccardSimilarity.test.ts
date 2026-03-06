import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getJaccardSimilarity', () => {
  it('両方空は0', () => {
    expect(MathHelper.getJaccardSimilarity([], [])).toBe(0);
  });

  it('完全一致は100', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2, 3], [1, 2, 3])).toBe(100);
  });

  it('共通なしは0', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2], [3, 4])).toBe(0);
  });

  it('部分一致', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2, 3], [2, 3, 4])).toBe(50);
  });

  it('片方空は0', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2], [])).toBe(0);
  });

  it('1件同じは100', () => {
    expect(MathHelper.getJaccardSimilarity([5], [5])).toBe(100);
  });

  it('重複要素は無視', () => {
    expect(MathHelper.getJaccardSimilarity([1, 1, 2], [1, 2, 2])).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = MathHelper.getJaccardSimilarity([1, 2, 3, 4], [3, 4, 5, 6]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('共通が多いほどスコアが高い', () => {
    const low = MathHelper.getJaccardSimilarity([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);
    const high = MathHelper.getJaccardSimilarity([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
    expect(high).toBeGreaterThan(low);
  });

  it('包含関係', () => {
    const result = MathHelper.getJaccardSimilarity([1, 2], [1, 2, 3, 4]);
    expect(result).toBe(50);
  });
});

describe('MathHelper.getJaccardSimilarityLabel', () => {
  it('類似度高は類似', () => {
    expect(MathHelper.getJaccardSimilarityLabel(80)).toBe('類似');
  });

  it('類似度中はやや類似', () => {
    expect(MathHelper.getJaccardSimilarityLabel(50)).toBe('やや類似');
  });

  it('類似度低は異なる', () => {
    expect(MathHelper.getJaccardSimilarityLabel(20)).toBe('異なる');
  });
});
