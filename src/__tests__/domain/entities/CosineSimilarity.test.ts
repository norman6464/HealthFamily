import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getCosineSimilarity', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getCosineSimilarity([], [])).toBe(0);
  });

  it('長さが異なる場合は短い方に合わせる', () => {
    const result = MathHelper.getCosineSimilarity([1, 0], [1]);
    expect(result).toBe(1);
  });

  it('同じベクトルは1を返す', () => {
    expect(MathHelper.getCosineSimilarity([1, 2, 3], [1, 2, 3])).toBe(1);
  });

  it('正反対のベクトルは-1を返す', () => {
    expect(MathHelper.getCosineSimilarity([1, 2, 3], [-1, -2, -3])).toBe(-1);
  });

  it('直交ベクトルは0を返す', () => {
    expect(MathHelper.getCosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('ゼロベクトルは0を返す', () => {
    expect(MathHelper.getCosineSimilarity([0, 0], [1, 2])).toBe(0);
  });

  it('スカラー倍は1を返す', () => {
    expect(MathHelper.getCosineSimilarity([1, 2, 3], [2, 4, 6])).toBe(1);
  });

  it('-1から1の範囲内', () => {
    const result = MathHelper.getCosineSimilarity([3, 1, 5], [2, 7, 1]);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('小数点2桁に丸められる', () => {
    const result = MathHelper.getCosineSimilarity([1, 3], [2, 5]);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });
});

describe('MathHelper.getCosineSimilarityLabel', () => {
  it('類似度0.7以上は類似', () => {
    expect(MathHelper.getCosineSimilarityLabel(0.8)).toBe('類似');
  });

  it('類似度0.3以上はやや類似', () => {
    expect(MathHelper.getCosineSimilarityLabel(0.5)).toBe('やや類似');
  });

  it('類似度0.3未満で-0.3超は無関係', () => {
    expect(MathHelper.getCosineSimilarityLabel(0)).toBe('無関係');
  });

  it('類似度-0.7以下は正反対', () => {
    expect(MathHelper.getCosineSimilarityLabel(-0.8)).toBe('正反対');
  });
});
