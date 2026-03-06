import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('getStockEfficiencyScore', () => {
  it('消費量0・在庫正の場合0を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyScore(0, 100)).toBe(0);
  });

  it('在庫0・消費量正の場合0を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyScore(50, 0)).toBe(0);
  });

  it('消費量と在庫が等しい場合100を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyScore(100, 100)).toBe(100);
  });

  it('消費量が在庫の半分の場合50を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyScore(50, 100)).toBe(50);
  });

  it('消費量が在庫を超える場合100を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyScore(150, 100)).toBe(100);
  });

  it('両方0の場合0を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyScore(0, 0)).toBe(0);
  });

  it('小数値でも正しく計算する', () => {
    const score = StockAlertEntity.getStockEfficiencyScore(7.5, 10);
    expect(score).toBe(75);
  });
});

describe('getStockEfficiencyLabel', () => {
  it('80以上は効率的を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyLabel(85)).toBe('効率的');
  });

  it('50以上80未満は標準を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyLabel(60)).toBe('標準');
  });

  it('50未満は非効率を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyLabel(30)).toBe('非効率');
  });

  it('100は効率的を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyLabel(100)).toBe('効率的');
  });

  it('0は非効率を返す', () => {
    expect(StockAlertEntity.getStockEfficiencyLabel(0)).toBe('非効率');
  });
});
