import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleCompletionTrend - エッジケース', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([])).toBe(0);
  });

  it('1件は0', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([80])).toBe(0);
  });

  it('全て同じ値は0', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([50, 50, 50, 50])).toBe(0);
  });

  it('完全な上昇は正の値', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([0, 25, 50, 75, 100]);
    expect(result).toBe(25);
  });

  it('完全な下降は負の値', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([100, 75, 50, 25, 0]);
    expect(result).toBe(-25);
  });

  it('V字型は傾き0に近い', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([100, 50, 0, 50, 100]);
    expect(Math.abs(result)).toBeLessThan(5);
  });

  it('2件の上昇', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([40, 60]);
    expect(result).toBe(20);
  });

  it('2件の下降', () => {
    const result = ScheduleEntity.getScheduleCompletionTrend([60, 40]);
    expect(result).toBe(-20);
  });

  it('急上昇と緩上昇の比較', () => {
    const steep = ScheduleEntity.getScheduleCompletionTrend([0, 50, 100]);
    const gentle = ScheduleEntity.getScheduleCompletionTrend([40, 50, 60]);
    expect(steep).toBeGreaterThan(gentle);
  });

  it('全て0は0', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([0, 0, 0])).toBe(0);
  });

  it('全て100は0', () => {
    expect(ScheduleEntity.getScheduleCompletionTrend([100, 100, 100])).toBe(0);
  });

  it('大量データでも正常に処理', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = ScheduleEntity.getScheduleCompletionTrend(data);
    expect(result).toBe(1);
  });
});

describe('ScheduleEntity.getScheduleCompletionTrendLabel - 境界値', () => {
  it('正の値は上昇', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(0.01)).toBe('上昇');
  });

  it('負の値は下降', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(-0.01)).toBe('下降');
  });

  it('0は横ばい', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(0)).toBe('横ばい');
  });

  it('大きな正の値は上昇', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(50)).toBe('上昇');
  });

  it('大きな負の値は下降', () => {
    expect(ScheduleEntity.getScheduleCompletionTrendLabel(-50)).toBe('下降');
  });
});
