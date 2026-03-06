import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentDensityScore - エッジケース', () => {
  it('両方0は0', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(0, 0)).toBe(0);
  });

  it('件数0は0', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(0, 30)).toBe(0);
  });

  it('日数0は0', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(5, 0)).toBe(0);
  });

  it('1件/1日は100', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(1, 1)).toBe(100);
  });

  it('1件/30日', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(1, 30)).toBe(3);
  });

  it('30件/30日は100', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(30, 30)).toBe(100);
  });

  it('超過しても100', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(100, 30)).toBe(100);
  });

  it('件数が多いほどスコアが高い', () => {
    const low = AppointmentEntity.getAppointmentDensityScore(3, 30);
    const high = AppointmentEntity.getAppointmentDensityScore(20, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('日数が多いほどスコアが低い', () => {
    const low = AppointmentEntity.getAppointmentDensityScore(10, 100);
    const high = AppointmentEntity.getAppointmentDensityScore(10, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = AppointmentEntity.getAppointmentDensityScore(7, 20);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大きな値', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(365, 365)).toBe(100);
  });

  it('負の件数は0', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(-5, 30)).toBe(0);
  });
});

describe('AppointmentEntity.getAppointmentDensityScoreLabel - エッジケース', () => {
  it('スコア100は密', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(100)).toBe('密');
  });

  it('スコア70は密', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(70)).toBe('密');
  });

  it('スコア69は適度', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(69)).toBe('適度');
  });

  it('スコア30は適度', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(30)).toBe('適度');
  });

  it('スコア29は疎', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(29)).toBe('疎');
  });

  it('スコア0は疎', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(0)).toBe('疎');
  });
});
