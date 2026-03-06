import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentClusterScore', () => {
  it('空配列は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([30])).toBe(0);
  });

  it('均等な間隔は低スコア', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([30, 30, 30, 30]);
    expect(result).toBeLessThan(30);
  });

  it('偏った間隔は高スコア', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([1, 1, 1, 90]);
    expect(result).toBeGreaterThan(50);
  });

  it('全て同じ間隔は低スコア', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([14, 14, 14]);
    expect(result).toBeLessThan(20);
  });

  it('結果は0-100', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([5, 30, 10, 60]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('ばらつきが大きいほど高スコア', () => {
    const even = AppointmentEntity.getAppointmentClusterScore([30, 30, 30]);
    const clustered = AppointmentEntity.getAppointmentClusterScore([1, 1, 90]);
    expect(clustered).toBeGreaterThan(even);
  });
});

describe('AppointmentEntity.getAppointmentClusterScoreLabel', () => {
  it('スコア30未満は分散', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(15)).toBe('分散');
  });

  it('スコア30-60はやや集中', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(45)).toBe('やや集中');
  });

  it('スコア60以上は集中', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(70)).toBe('集中');
  });
});
