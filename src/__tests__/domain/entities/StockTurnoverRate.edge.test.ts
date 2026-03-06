import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockTurnoverRate - エッジケース', () => {
  it('消費量0は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(0, 100)).toBe(0);
  });

  it('平均在庫0は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(100, 0)).toBe(0);
  });

  it('両方0は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(0, 0)).toBe(0);
  });

  it('負の消費量は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(-50, 100)).toBe(0);
  });

  it('負の在庫は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(50, -100)).toBe(0);
  });

  it('消費量=在庫で回転率1', () => {
    expect(StockAlertEntity.getStockTurnoverRate(100, 100)).toBe(1);
  });

  it('消費量が在庫の10倍で回転率10', () => {
    expect(StockAlertEntity.getStockTurnoverRate(1000, 100)).toBe(10);
  });

  it('消費量が在庫の1/10で回転率0.1', () => {
    expect(StockAlertEntity.getStockTurnoverRate(10, 100)).toBe(0.1);
  });

  it('小数の消費量', () => {
    const result = StockAlertEntity.getStockTurnoverRate(1.5, 3);
    expect(result).toBe(0.5);
  });

  it('小数の在庫', () => {
    const result = StockAlertEntity.getStockTurnoverRate(3, 1.5);
    expect(result).toBe(2);
  });

  it('非常に小さな在庫で大きな回転率', () => {
    const result = StockAlertEntity.getStockTurnoverRate(100, 1);
    expect(result).toBe(100);
  });

  it('非常に大きな在庫で小さな回転率', () => {
    const result = StockAlertEntity.getStockTurnoverRate(1, 10000);
    expect(result).toBe(0);
  });

  it('結果は小数点2桁に丸められる', () => {
    const result = StockAlertEntity.getStockTurnoverRate(1, 3);
    expect(result).toBe(0.33);
  });

  it('回転率は常に0以上', () => {
    const result = StockAlertEntity.getStockTurnoverRate(50, 200);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('StockAlertEntity.getStockTurnoverRateLabel - 境界値', () => {
  it('回転率2は高回転(境界値)', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(2)).toBe('高回転');
  });

  it('回転率1.99は普通', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(1.99)).toBe('普通');
  });

  it('回転率0.5は普通(境界値)', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(0.5)).toBe('普通');
  });

  it('回転率0.49は低回転', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(0.49)).toBe('低回転');
  });

  it('回転率0は低回転', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(0)).toBe('低回転');
  });

  it('回転率100は高回転', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(100)).toBe('高回転');
  });
});
