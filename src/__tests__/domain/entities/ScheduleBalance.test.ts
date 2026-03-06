import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleBalance', () => {
  it('空配列は0を返す', () => {
    expect(ScheduleEntity.getScheduleBalance([])).toBe(0);
  });

  it('午前のみは0', () => {
    expect(ScheduleEntity.getScheduleBalance([480, 540, 600])).toBe(0);
  });

  it('午後のみは0', () => {
    expect(ScheduleEntity.getScheduleBalance([780, 840, 900])).toBe(0);
  });

  it('午前午後均等は100', () => {
    // 8:00, 9:00 (AM) + 14:00, 15:00 (PM)
    expect(ScheduleEntity.getScheduleBalance([480, 540, 840, 900])).toBe(100);
  });

  it('午前多めは100未満', () => {
    // 3AM + 1PM
    const result = ScheduleEntity.getScheduleBalance([480, 540, 600, 840]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it('1件のみは0(バランス判定不可)', () => {
    expect(ScheduleEntity.getScheduleBalance([480])).toBe(0);
  });

  it('0-100の範囲内に収まる', () => {
    const result = ScheduleEntity.getScheduleBalance([480, 540, 840, 900, 960]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('ScheduleEntity.getScheduleBalanceLabel', () => {
  it('スコア70以上は均衡', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(70)).toBe('均衡');
  });

  it('スコア40以上はやや偏り', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(50)).toBe('やや偏り');
  });

  it('スコア40未満は偏り', () => {
    expect(ScheduleEntity.getScheduleBalanceLabel(20)).toBe('偏り');
  });
});
