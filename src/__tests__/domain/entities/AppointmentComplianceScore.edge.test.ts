import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentComplianceScore - エッジケース', () => {
  it('全て0は0', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(0, 0, 0)).toBe(0);
  });

  it('全て100は100', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(100, 100, 100)).toBe(100);
  });

  it('完了率のみ100', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(100, 0, 0)).toBe(50);
  });

  it('時間厳守のみ100', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(0, 100, 0)).toBe(30);
  });

  it('規則性のみ100', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(0, 0, 100)).toBe(20);
  });

  it('負の値は0扱い', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(-50, -50, -50)).toBe(0);
  });

  it('超過値は100扱い', () => {
    expect(AppointmentEntity.getAppointmentComplianceScore(200, 200, 200)).toBe(100);
  });

  it('完了率が重み最大', () => {
    const highCompletion = AppointmentEntity.getAppointmentComplianceScore(100, 50, 50);
    const highPunctuality = AppointmentEntity.getAppointmentComplianceScore(50, 100, 50);
    expect(highCompletion).toBeGreaterThan(highPunctuality);
  });

  it('時間厳守は規則性より重い', () => {
    const highPunctuality = AppointmentEntity.getAppointmentComplianceScore(50, 100, 0);
    const highRegularity = AppointmentEntity.getAppointmentComplianceScore(50, 0, 100);
    expect(highPunctuality).toBeGreaterThan(highRegularity);
  });

  it('中程度の値', () => {
    const result = AppointmentEntity.getAppointmentComplianceScore(50, 50, 50);
    expect(result).toBe(50);
  });

  it('結果は0-100の範囲', () => {
    const result = AppointmentEntity.getAppointmentComplianceScore(60, 70, 40);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('完了率が高いほどスコアが高い', () => {
    const low = AppointmentEntity.getAppointmentComplianceScore(20, 50, 50);
    const high = AppointmentEntity.getAppointmentComplianceScore(80, 50, 50);
    expect(high).toBeGreaterThan(low);
  });
});

describe('AppointmentEntity.getAppointmentComplianceScoreLabel - エッジケース', () => {
  it('100は良好', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(100)).toBe('良好');
  });

  it('80は良好', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(80)).toBe('良好');
  });

  it('79は普通', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(79)).toBe('普通');
  });

  it('50は普通', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(50)).toBe('普通');
  });

  it('49は要改善', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(49)).toBe('要改善');
  });

  it('0は要改善', () => {
    expect(AppointmentEntity.getAppointmentComplianceScoreLabel(0)).toBe('要改善');
  });
});
