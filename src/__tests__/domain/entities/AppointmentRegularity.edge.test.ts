import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentRegularity - エッジケース', () => {
  it('空配列は0', () => {
    expect(AppointmentEntity.getAppointmentRegularity([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AppointmentEntity.getAppointmentRegularity([30])).toBe(0);
  });

  it('2件の同じ間隔は100', () => {
    expect(AppointmentEntity.getAppointmentRegularity([30, 30])).toBe(100);
  });

  it('全て同じ間隔は100', () => {
    expect(AppointmentEntity.getAppointmentRegularity([14, 14, 14, 14])).toBe(100);
  });

  it('全て0は100', () => {
    expect(AppointmentEntity.getAppointmentRegularity([0, 0, 0])).toBe(100);
  });

  it('大きなばらつきは低スコア', () => {
    const result = AppointmentEntity.getAppointmentRegularity([1, 90, 1, 90]);
    expect(result).toBeLessThan(50);
  });

  it('小さなばらつきは高スコア', () => {
    const result = AppointmentEntity.getAppointmentRegularity([29, 30, 31]);
    expect(result).toBeGreaterThan(90);
  });

  it('0-100の範囲内', () => {
    const result = AppointmentEntity.getAppointmentRegularity([7, 60, 14, 90]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('規則的な方がスコアが高い', () => {
    const regular = AppointmentEntity.getAppointmentRegularity([30, 30, 30]);
    const irregular = AppointmentEntity.getAppointmentRegularity([7, 60, 14]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('大量データでも正常に処理', () => {
    const data = Array.from({ length: 50 }, () => 28);
    expect(AppointmentEntity.getAppointmentRegularity(data)).toBe(100);
  });

  it('2件の大きく異なる間隔', () => {
    const result = AppointmentEntity.getAppointmentRegularity([7, 90]);
    expect(result).toBeLessThan(50);
  });

  it('3件中1件だけ異なる', () => {
    const result = AppointmentEntity.getAppointmentRegularity([30, 30, 60]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });
});

describe('AppointmentEntity.getAppointmentRegularityLabel - 境界値', () => {
  it('スコア80は規則的(境界値)', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(80)).toBe('規則的');
  });

  it('スコア79はやや不規則', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(79)).toBe('やや不規則');
  });

  it('スコア50はやや不規則(境界値)', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(50)).toBe('やや不規則');
  });

  it('スコア49は不規則', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(49)).toBe('不規則');
  });

  it('スコア0は不規則', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(0)).toBe('不規則');
  });

  it('スコア100は規則的', () => {
    expect(AppointmentEntity.getAppointmentRegularityLabel(100)).toBe('規則的');
  });
});
