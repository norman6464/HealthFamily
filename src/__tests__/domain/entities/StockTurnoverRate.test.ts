import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockTurnoverRate', () => {
  it('平均在庫0は0を返す', () => {
    expect(StockAlertEntity.getStockTurnoverRate(100, 0)).toBe(0);
  });

  it('消費量0は0を返す', () => {
    expect(StockAlertEntity.getStockTurnoverRate(0, 100)).toBe(0);
  });

  it('消費量と在庫が同じなら回転率1', () => {
    expect(StockAlertEntity.getStockTurnoverRate(100, 100)).toBe(1);
  });

  it('消費量が在庫の2倍なら回転率2', () => {
    expect(StockAlertEntity.getStockTurnoverRate(200, 100)).toBe(2);
  });

  it('消費量が在庫の半分なら回転率0.5', () => {
    expect(StockAlertEntity.getStockTurnoverRate(50, 100)).toBe(0.5);
  });

  it('小数の結果も正しく返す', () => {
    const result = StockAlertEntity.getStockTurnoverRate(100, 300);
    expect(result).toBeCloseTo(0.33, 1);
  });

  it('負の消費量は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(-100, 50)).toBe(0);
  });

  it('負の在庫は0', () => {
    expect(StockAlertEntity.getStockTurnoverRate(100, -50)).toBe(0);
  });
});

describe('StockAlertEntity.getStockTurnoverRateLabel', () => {
  it('回転率2以上は高回転', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(3)).toBe('高回転');
  });

  it('回転率0.5以上は普通', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(1)).toBe('普通');
  });

  it('回転率0.5未満は低回転', () => {
    expect(StockAlertEntity.getStockTurnoverRateLabel(0.3)).toBe('低回転');
  });
});
