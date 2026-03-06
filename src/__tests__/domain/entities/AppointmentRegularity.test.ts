import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentRegularity', () => {
  it('空配列は0を返す', () => {
    expect(AppointmentEntity.getAppointmentRegularity([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(AppointmentEntity.getAppointmentRegularity([30])).toBe(0);
  });

  it('全て等間隔は100', () => {
    expect(AppointmentEntity.getAppointmentRegularity([30, 30, 30])).toBe(100);
  });

  it('ばらつきがあると100未満', () => {
    const result = AppointmentEntity.getAppointmentRegularity([7, 30, 14, 60]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('大きなばらつきは低スコア', () => {
    const regular = AppointmentEntity.getAppointmentRegularity([30, 30, 30]);
    const irregular = AppointmentEntity.getAppointmentRegularity([7, 90, 14]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('0-100の範囲内', () => {
    const result = AppointmentEntity.getAppointmentRegularity([1, 100, 5, 80]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件でも計算可能', () => {
    expect(AppointmentEntity.getAppointmentRegularity([30, 30])).toBe(100);
  });
});

describe('AppointmentEntity.getAppointmentRegularityLabel', () => {
  it('スコア80以上は規則的', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(85)).toBe('規則的');
  });

  it('スコア50以上はやや不規則', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(60)).toBe('やや不規則');
  });

  it('スコア50未満は不規則', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(30)).toBe('不規則');
  });
});
