import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleConflictRate', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([])).toBe(0);
  });

  it('1件は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480])).toBe(0);
  });

  it('全て異なる時刻は0', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 720, 960])).toBe(0);
  });

  it('全て同じ時刻は100', () => {
    expect(ScheduleEntity.getScheduleConflictRate([480, 480, 480])).toBe(100);
  });

  it('一部が近い時刻', () => {
    const result = ScheduleEntity.getScheduleConflictRate([480, 485, 720]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('結果は0-100', () => {
    const result = ScheduleEntity.getScheduleConflictRate([100, 110, 200, 210, 300]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('競合が多いほど高い', () => {
    const few = ScheduleEntity.getScheduleConflictRate([480, 490, 720, 960]);
    const many = ScheduleEntity.getScheduleConflictRate([480, 485, 490, 495]);
    expect(many).toBeGreaterThan(few);
  });
});

describe('ScheduleEntity.getScheduleConflictRateLabel', () => {
  it('スコア10未満は競合なし', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(5)).toBe('競合なし');
  });

  it('スコア10-30はやや競合', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(20)).toBe('やや競合');
  });

  it('スコア30以上は競合多い', () => {
    expect(ScheduleEntity.getScheduleConflictRateLabel(50)).toBe('競合多い');
  });
});
