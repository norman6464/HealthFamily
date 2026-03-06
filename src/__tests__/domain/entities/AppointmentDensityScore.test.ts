import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentDensityScore', () => {
  it('0件は0', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(0, 30)).toBe(0);
  });

  it('30件/30日は100', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(30, 30)).toBe(100);
  });

  it('15件/30日は50', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(15, 30)).toBe(50);
  });

  it('日数0は0', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(5, 0)).toBe(0);
  });

  it('件数が日数を超えても100', () => {
    expect(AppointmentEntity.getAppointmentDensityScore(60, 30)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = AppointmentEntity.getAppointmentDensityScore(5, 20);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('件数が多いほどスコアが高い', () => {
    const low = AppointmentEntity.getAppointmentDensityScore(2, 30);
    const high = AppointmentEntity.getAppointmentDensityScore(20, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('1件/30日', () => {
    const result = AppointmentEntity.getAppointmentDensityScore(1, 30);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });
});

describe('AppointmentEntity.getAppointmentDensityScoreLabel', () => {
  it('スコア70以上は密', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(80)).toBe('密');
  });

  it('スコア30-70は適度', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(50)).toBe('適度');
  });

  it('スコア30未満は疎', () => {
    expect(AppointmentEntity.getAppointmentDensityScoreLabel(20)).toBe('疎');
  });
});
