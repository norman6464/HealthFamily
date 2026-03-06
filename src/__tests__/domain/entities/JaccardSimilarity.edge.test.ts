import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getJaccardSimilarity - エッジケース', () => {
  it('両方空は0', () => {
    expect(MathHelper.getJaccardSimilarity([], [])).toBe(0);
  });

  it('片方空（左）は0', () => {
    expect(MathHelper.getJaccardSimilarity([], [1, 2])).toBe(0);
  });

  it('片方空（右）は0', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2], [])).toBe(0);
  });

  it('1件同値は100', () => {
    expect(MathHelper.getJaccardSimilarity([1], [1])).toBe(100);
  });

  it('1件異値は0', () => {
    expect(MathHelper.getJaccardSimilarity([1], [2])).toBe(0);
  });

  it('完全一致は100', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(100);
  });

  it('完全不一致は0', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2, 3], [4, 5, 6])).toBe(0);
  });

  it('部分一致50%', () => {
    expect(MathHelper.getJaccardSimilarity([1, 2, 3], [2, 3, 4])).toBe(50);
  });

  it('包含関係（小さい方が部分集合）', () => {
    expect(MathHelper.getJaccardSimilarity([1], [1, 2, 3])).toBe(33);
  });

  it('重複要素は無視される', () => {
    expect(MathHelper.getJaccardSimilarity([1, 1, 1], [1])).toBe(100);
  });

  it('順序に依存しない', () => {
    const a = MathHelper.getJaccardSimilarity([3, 1, 2], [2, 3, 1]);
    expect(a).toBe(100);
  });

  it('対称性', () => {
    const ab = MathHelper.getJaccardSimilarity([1, 2], [2, 3]);
    const ba = MathHelper.getJaccardSimilarity([2, 3], [1, 2]);
    expect(ab).toBe(ba);
  });

  it('大量データ', () => {
    const a = Array.from({ length: 100 }, (_, i) => i);
    const b = Array.from({ length: 100 }, (_, i) => i);
    expect(MathHelper.getJaccardSimilarity(a, b)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = MathHelper.getJaccardSimilarity([1, 2, 3, 4], [3, 4, 5, 6]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MathHelper.getJaccardSimilarityLabel - エッジケース', () => {
  it('100は類似', () => {
    expect(MathHelper.getJaccardSimilarityLabel(100)).toBe('類似');
  });

  it('70は類似', () => {
    expect(MathHelper.getJaccardSimilarityLabel(70)).toBe('類似');
  });

  it('69はやや類似', () => {
    expect(MathHelper.getJaccardSimilarityLabel(69)).toBe('やや類似');
  });

  it('40はやや類似', () => {
    expect(MathHelper.getJaccardSimilarityLabel(40)).toBe('やや類似');
  });

  it('39は異なる', () => {
    expect(MathHelper.getJaccardSimilarityLabel(39)).toBe('異なる');
  });

  it('0は異なる', () => {
    expect(MathHelper.getJaccardSimilarityLabel(0)).toBe('異なる');
  });
});
