import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentClusterScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([30])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([30, 30])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([14, 14, 14, 14])).toBe(0);
  });

  it('全て0は0', () => {
    expect(AppointmentEntity.getAppointmentClusterScore([0, 0, 0])).toBe(0);
  });

  it('2件の異なる値', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([1, 90]);
    expect(result).toBeGreaterThan(0);
  });

  it('結果は0-100', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([5, 10, 50, 80]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('極端なばらつきでも100を超えない', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([1, 1000]);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 50 }, (_, i) => (i % 3 === 0 ? 1 : 30));
    const result = AppointmentEntity.getAppointmentClusterScore(data);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('ばらつき大 > ばらつき小', () => {
    const even = AppointmentEntity.getAppointmentClusterScore([30, 30, 30]);
    const clustered = AppointmentEntity.getAppointmentClusterScore([1, 1, 90]);
    expect(clustered).toBeGreaterThan(even);
  });

  it('3件の等差数列', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([10, 20, 30]);
    expect(result).toBeGreaterThan(0);
  });

  it('交互パターン', () => {
    const result = AppointmentEntity.getAppointmentClusterScore([7, 60, 7, 60]);
    expect(result).toBeGreaterThan(0);
  });

  it('同一値の長い配列は0', () => {
    const data = Array.from({ length: 20 }, () => 14);
    expect(AppointmentEntity.getAppointmentClusterScore(data)).toBe(0);
  });
});

describe('AppointmentEntity.getAppointmentClusterScoreLabel - 境界値', () => {
  it('スコア0は分散', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(0)).toBe('分散');
  });

  it('スコア29は分散', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(29)).toBe('分散');
  });

  it('スコア30はやや集中(境界値)', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(30)).toBe('やや集中');
  });

  it('スコア59はやや集中', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(59)).toBe('やや集中');
  });

  it('スコア60は集中(境界値)', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(60)).toBe('集中');
  });

  it('スコア100は集中', () => {
    expect(AppointmentEntity.getAppointmentClusterScoreLabel(100)).toBe('集中');
  });
});
