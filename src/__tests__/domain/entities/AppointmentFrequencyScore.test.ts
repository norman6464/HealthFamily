import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentFrequencyScore', () => {
  it('空配列は0を返す', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([])).toBe(0);
  });

  it('1件のみは0を返す(間隔算出不可)', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScore([30])).toBe(0);
  });

  it('短い間隔は高スコア', () => {
    const result = AppointmentEntity.getAppointmentFrequencyScore([7, 7, 7]);
    expect(result).toBeGreaterThan(70);
  });

  it('長い間隔は低スコア', () => {
    const result = AppointmentEntity.getAppointmentFrequencyScore([90, 90, 90]);
    expect(result).toBeLessThan(30);
  });

  it('中程度の間隔は中程度のスコア', () => {
    const result = AppointmentEntity.getAppointmentFrequencyScore([30, 30, 30]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(70);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = AppointmentEntity.getAppointmentFrequencyScore([1, 1]);
    const result2 = AppointmentEntity.getAppointmentFrequencyScore([365, 365]);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
  });
});

describe('AppointmentEntity.getAppointmentFrequencyScoreLabel', () => {
  it('スコア70以上は高頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(70)).toBe('高頻度');
  });

  it('スコア40以上は中頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(50)).toBe('中頻度');
  });

  it('スコア40未満は低頻度', () => {
    expect(AppointmentEntity.getAppointmentFrequencyScoreLabel(20)).toBe('低頻度');
  });
});
