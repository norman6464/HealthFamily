import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentLeadTime', () => {
  it('空配列は0', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([])).toBe(0);
  });

  it('1要素はその値', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([14])).toBe(14);
  });

  it('複数の値は平均', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([7, 14, 21])).toBe(14);
  });

  it('全て同じ値', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([10, 10, 10])).toBe(10);
  });

  it('全て0は0', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([0, 0, 0])).toBe(0);
  });

  it('負の値は0としてクランプ', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([-5, 10])).toBe(5);
  });

  it('結果は整数', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([3, 5, 7]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('大きな値', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([90, 90])).toBe(90);
  });

  it('小数の日数は丸められる', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([7, 8]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('値が増えるとリードタイムも増える', () => {
    const short = AppointmentEntity.getAppointmentLeadTime([3, 3, 3]);
    const long = AppointmentEntity.getAppointmentLeadTime([30, 30, 30]);
    expect(long).toBeGreaterThan(short);
  });

  it('多数の要素', () => {
    const days = Array.from({ length: 50 }, () => 14);
    expect(AppointmentEntity.getAppointmentLeadTime(days)).toBe(14);
  });
});

describe('AppointmentEntity.getAppointmentLeadTimeLabel', () => {
  it('14日以上は余裕あり', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(20)).toBe('余裕あり');
  });

  it('7日以上は適切', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(10)).toBe('適切');
  });

  it('7日未満は直前', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(3)).toBe('直前');
  });
});
