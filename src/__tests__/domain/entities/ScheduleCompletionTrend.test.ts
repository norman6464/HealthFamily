import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleCompletionTrend', () => {
  it('空配列は0を返す', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([80])).toBe(0);
  });

  it('上昇傾向は正の値', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([50, 60, 70, 80]);
    expect(result).toBeGreaterThan(0);
  });

  it('下降傾向は負の値', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([80, 70, 60, 50]);
    expect(result).toBeLessThan(0);
  });

  it('横ばいは0に近い', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([50, 50, 50, 50]);
    expect(result).toBe(0);
  });

  it('2件でも計算可能', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([40, 60]);
    expect(result).toBeGreaterThan(0);
  });

  it('急上昇は大きな正の値', () => {
    const slow = ScheduleEntity.getScheduleCompletionTrend([50, 55, 60]);
    const fast = ScheduleEntity.getScheduleCompletionTrend([20, 60, 100]);
    expect(fast).toBeGreaterThan(slow);
  });
});

describe('ScheduleEntity.getScheduleCompletionTrendLabel', () => {
  it('正の値は上昇', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(5)).toBe('上昇');
  });

  it('負の値は下降', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(-5)).toBe('下降');
  });

  it('0は横ばい', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(0)).toBe('横ばい');
  });
});
