import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentFrequencyScore - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([14])).toBe(0);
  });

  it('間隔0日は100を返す', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([0, 0])).toBe(100);
  });

  it('間隔90日は0を返す(基準値)', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([90, 90])).toBe(0);
  });

  it('間隔90日超でも0未満にならない', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([180, 180])).toBe(0);
  });

  it('間隔45日は50を返す', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([45, 45])).toBe(50);
  });

  it('大量データでも正しく計算', () => {
    const intervals = Array(50).fill(14);
    const result = AppointmentEntity.getAppointmentFrequencyScore(intervals);
    expect(result).toBeGreaterThan(80);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = AppointmentEntity.getAppointmentFrequencyScore([1, 1]);
    const result2 = AppointmentEntity.getAppointmentFrequencyScore([365, 365]);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result2).toBeGreaterThanOrEqual(0);
  });

  it('混在した間隔は平均で計算', () => {
    // [14, 90] -> avg=52 -> 100-(52/90)*100=42
    const result = AppointmentEntity.getAppointmentFrequencyScore([14, 90]);
    expect(result).toBe(42);
  });
});

describe('AppointmentEntity.getAppointmentFrequencyScoreLabel - 境界値', () => {
  it('スコア70は高頻度(境界値)', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(70)).toBe('高頻度');
  });

  it('スコア69は中頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(69)).toBe('中頻度');
  });

  it('スコア40は中頻度(境界値)', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(40)).toBe('中頻度');
  });

  it('スコア39は低頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(39)).toBe('低頻度');
  });

  it('スコア0は低頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(0)).toBe('低頻度');
  });

  it('スコア100は高頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(100)).toBe('高頻度');
  });
});
