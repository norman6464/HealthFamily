import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleConflictRate - エッジケース', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([])).toBe(0);
  });

  it('1件は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480])).toBe(0);
  });

  it('2件の同値は100', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 480])).toBe(100);
  });

  it('2件の15分差は100(境界値)', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 495])).toBe(100);
  });

  it('2件の16分差は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 496])).toBe(0);
  });

  it('全て離れている場合は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([100, 200, 300, 400])).toBe(0);
  });

  it('全て同じ時刻は100', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 480, 480, 480])).toBe(100);
  });

  it('結果は0-100', () => {
    const result = ScheduleEntity.getScheduleConflictRate([100, 110, 200, 210, 300]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 50 }, (_, i) => i * 60);
    const result = ScheduleEntity.getScheduleConflictRate(data);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('隣接のみ近い', () => {
    const result = ScheduleEntity.getScheduleConflictRate([480, 490, 720, 730]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('3件中2件が近い', () => {
    const result = ScheduleEntity.getScheduleConflictRate([480, 485, 960]);
    expect(result).toBe(33);
  });

  it('全て1分差', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 481, 482])).toBe(100);
  });

  it('0分の時刻', () => {
    const result = ScheduleEntity.getScheduleConflictRate([0, 15, 30]);
    expect(result).toBeGreaterThan(0);
  });

  it('1440分(24時)付近', () => {
    const result = ScheduleEntity.getScheduleConflictRate([1430, 1440, 100]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('ScheduleEntity.getScheduleConflictRateLabel - 境界値', () => {
  it('スコア0は競合なし', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(0)).toBe('競合なし');
  });

  it('スコア9は競合なし', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(9)).toBe('競合なし');
  });

  it('スコア10はやや競合(境界値)', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(10)).toBe('やや競合');
  });

  it('スコア29はやや競合', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(29)).toBe('やや競合');
  });

  it('スコア30は競合多い(境界値)', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(30)).toBe('競合多い');
  });

  it('スコア100は競合多い', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(100)).toBe('競合多い');
  });
});
