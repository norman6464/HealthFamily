import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentLeadTime エッジケース', () => {
  it('全て0は0', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([0, 0, 0])).toBe(0);
  });

  it('全て同じ値はその値', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([7, 7, 7])).toBe(7);
  });

  it('負の値は0にクランプ', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([-10])).toBe(0);
  });

  it('全て負は0', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([-5, -10, -15])).toBe(0);
  });

  it('混在する正負の値', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([-5, 10, 20]);
    expect(result).toBe(10);
  });

  it('非常に大きな値', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([365])).toBe(365);
  });

  it('小数の日数は丸められる', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([7, 8, 9]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('多数の要素', () => {
    const days = Array.from({ length: 100 }, () => 14);
    expect(AppointmentEntity.getAppointmentLeadTime(days)).toBe(14);
  });

  it('2要素の平均', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([10, 20])).toBe(15);
  });

  it('3要素の平均で丸め', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([1, 2, 3]);
    expect(result).toBe(2);
  });

  it('1日は1', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([1])).toBe(1);
  });

  it('値が大きいほどリードタイムも大きい', () => {
    const short = AppointmentEntity.getAppointmentLeadTime([3]);
    const long = AppointmentEntity.getAppointmentLeadTime([30]);
    expect(long).toBeGreaterThan(short);
  });

  it('ばらつきのある値', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([1, 30, 7, 14, 60]);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('0と大きな値の混在', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([0, 28]);
    expect(result).toBe(14);
  });

  it('3要素の不均等', () => {
    const result = AppointmentEntity.getAppointmentLeadTime([1, 1, 100]);
    expect(result).toBe(34);
  });

  it('100日は100', () => {
    expect(AppointmentEntity.getAppointmentLeadTime([100])).toBe(100);
  });
});

describe('AppointmentEntity.getAppointmentLeadTimeLabel エッジケース', () => {
  it('境界値14は余裕あり', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(14)).toBe('余裕あり');
  });

  it('境界値7は適切', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(7)).toBe('適切');
  });

  it('境界値13は適切', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(13)).toBe('適切');
  });

  it('境界値6は直前', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(6)).toBe('直前');
  });

  it('0は直前', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(0)).toBe('直前');
  });

  it('30は余裕あり', () => {
    expect(AppointmentEntity.getAppointmentLeadTimeLabel(30)).toBe('余裕あり');
  });
});
