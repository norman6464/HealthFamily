import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockStabilityScore - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(StockAlertEntity.getStockStabilityScore([])).toBe(0);
  });

  it('1件は100を返す', () => {
    expect(StockAlertEntity.getStockStabilityScore([50])).toBe(100);
  });

  it('2件で同じ値は100', () => {
    expect(StockAlertEntity.getStockStabilityScore([30, 30])).toBe(100);
  });

  it('全て0は0を返す(avg=0)', () => {
    expect(StockAlertEntity.getStockStabilityScore([0, 0, 0])).toBe(0);
  });

  it('非常に大きな値でも正しく計算', () => {
    const result = StockAlertEntity.getStockStabilityScore([1000000, 1000001]);
    expect(result).toBe(100);
  });

  it('1と1000000の極端な差は低スコア', () => {
    const result = StockAlertEntity.getStockStabilityScore([1, 1000000]);
    expect(result).toBe(0);
  });

  it('100件の安定データは高スコア', () => {
    const values = Array.from({ length: 100 }, () => 50 + Math.floor(Math.random() * 3) - 1);
    // 微小な変動なので高スコアになるはず
    const result = StockAlertEntity.getStockStabilityScore(values);
    expect(result).toBeGreaterThan(90);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = StockAlertEntity.getStockStabilityScore([1, 100]);
    const result2 = StockAlertEntity.getStockStabilityScore([50, 50]);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeLessThanOrEqual(100);
  });

  it('緩やかな増加は比較的安定', () => {
    const result = StockAlertEntity.getStockStabilityScore([100, 105, 110, 115, 120]);
    expect(result).toBeGreaterThan(80);
  });

  it('急激な増減は低スコア', () => {
    const result = StockAlertEntity.getStockStabilityScore([10, 100, 10, 100]);
    expect(result).toBeLessThan(30);
  });

  it('小数値も正しく処理', () => {
    const result = StockAlertEntity.getStockStabilityScore([10.5, 10.6, 10.4, 10.5]);
    expect(result).toBeGreaterThan(95);
  });
});

describe('StockAlertEntity.getStockStabilityLabel - 境界値', () => {
  it('スコア80は安定(境界値)', () => {
    expect(StockAlertEntity.getStockStabilityLabel(80)).toBe('安定');
  });

  it('スコア79はやや不安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(79)).toBe('やや不安定');
  });

  it('スコア50はやや不安定(境界値)', () => {
    expect(StockAlertEntity.getStockStabilityLabel(50)).toBe('やや不安定');
  });

  it('スコア49は不安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(49)).toBe('不安定');
  });

  it('スコア0は不安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(0)).toBe('不安定');
  });

  it('スコア100は安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(100)).toBe('安定');
  });
});
