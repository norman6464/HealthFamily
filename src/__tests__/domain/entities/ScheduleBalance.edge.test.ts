import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleBalance - エッジケース', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getScheduleBalance([])).toBe(0);
  });

  it('1件のみは0', () => {
    expect(ScheduleEntity.getScheduleBalance([600])).toBe(0);
  });

  it('全て午前(719分以下)は0', () => {
    expect(ScheduleEntity.getScheduleBalance([0, 360, 719])).toBe(0);
  });

  it('全て午後(720分以上)は0', () => {
    expect(ScheduleEntity.getScheduleBalance([720, 900, 1200])).toBe(0);
  });

  it('境界値: 719(午前)と720(午後)の組み合わせ', () => {
    expect(ScheduleEntity.getScheduleBalance([719, 720])).toBe(100);
  });

  it('AM1件PM1件は100(完全均衡)', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 840])).toBe(100);
  });

  it('AM2件PM1件は50', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 540, 840])).toBe(50);
  });

  it('AM1件PM2件は50', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 840, 900])).toBe(50);
  });

  it('AM3件PM1件は33', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 540, 600, 840])).toBe(33);
  });

  it('AM1件PM3件は33', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 840, 900, 960])).toBe(33);
  });

  it('0-100の範囲内に収まる', () => {
    const result = ScheduleEntity.getScheduleBalance([100, 200, 300, 800, 900]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('深夜0分は午前としてカウント', () => {
    expect(ScheduleEntity.getScheduleBalance([0, 720])).toBe(100);
  });

  it('23:59(1439分)は午後としてカウント', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 1439])).toBe(100);
  });

  it('大量の午前と1件の午後', () => {
    const times = [60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 780];
    const result = ScheduleEntity.getScheduleBalance(times);
    expect(result).toBeLessThan(20);
    expect(result).toBeGreaterThan(0);
  });

  it('均等に近い分布はスコアが高い', () => {
    const balanced = ScheduleEntity.getScheduleBalance([480, 540, 840, 900]);
    const unbalanced = ScheduleEntity.getScheduleBalance([480, 540, 600, 840]);
    expect(balanced).toBeGreaterThan(unbalanced);
  });

  it('全て同じ時刻(午前)は0', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 480, 480])).toBe(0);
  });
});

describe('ScheduleEntity.getScheduleBalanceLabel - 境界値', () => {
  it('スコア70は均衡(境界値)', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(70)).toBe('均衡');
  });

  it('スコア69はやや偏り', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(69)).toBe('やや偏り');
  });

  it('スコア40はやや偏り(境界値)', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(40)).toBe('やや偏り');
  });

  it('スコア39は偏り', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(39)).toBe('偏り');
  });

  it('スコア0は偏り', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(0)).toBe('偏り');
  });

  it('スコア100は均衡', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(100)).toBe('均衡');
  });
});
