import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentComplianceScore', () => {
  it('全て0は0', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(0, 0, 0)).toBe(0);
  });

  it('全て完璧は100', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(100, 100, 100)).toBe(100);
  });

  it('完了率のみ', () => {
    const result = AppointmentEntity.getAppointmentComplianceScore(100, 0, 0);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(60);
  });

  it('完了率が高いほどスコアが高い', () => {
    const low = AppointmentEntity.getAppointmentComplianceScore(30, 50, 50);
    const high = AppointmentEntity.getAppointmentComplianceScore(90, 50, 50);
    expect(high).toBeGreaterThan(low);
  });

  it('時間厳守が高いほどスコアが高い', () => {
    const low = AppointmentEntity.getAppointmentComplianceScore(80, 30, 50);
    const high = AppointmentEntity.getAppointmentComplianceScore(80, 90, 50);
    expect(high).toBeGreaterThan(low);
  });

  it('規則性が高いほどスコアが高い', () => {
    const low = AppointmentEntity.getAppointmentComplianceScore(80, 50, 20);
    const high = AppointmentEntity.getAppointmentComplianceScore(80, 50, 80);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = AppointmentEntity.getAppointmentComplianceScore(70, 60, 50);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(150, 150, 150)).toBeLessThanOrEqual(100);
  });
});

describe('AppointmentEntity.getAppointmentComplianceScoreLabel', () => {
  it('スコア高は良好', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(85)).toBe('良好');
  });

  it('スコア中は普通', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(55)).toBe('普通');
  });

  it('スコア低は要改善', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(25)).toBe('要改善');
  });
});
