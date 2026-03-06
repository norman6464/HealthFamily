import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('getAppointmentPunctuality', () => {
  it('空配列の場合0を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([])).toBe(0);
  });

  it('全て遅刻なしの場合100を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([0, 0, 0])).toBe(100);
  });

  it('全て大幅遅刻の場合低スコアを返す', () => {
    const score = AppointmentEntity.getAppointmentPunctuality([60, 60, 60]);
    expect(score).toBeLessThan(50);
  });

  it('1要素0分遅れの場合100を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([0])).toBe(100);
  });

  it('平均15分遅れの場合中程度のスコアを返す', () => {
    const score = AppointmentEntity.getAppointmentPunctuality([15, 15, 15]);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(80);
  });

  it('0-100の範囲に収まる', () => {
    const score = AppointmentEntity.getAppointmentPunctuality([120, 120, 120]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getAppointmentPunctualityLabel', () => {
  it('80以上は時間厳守を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(85)).toBe('時間厳守');
  });

  it('50以上80未満はやや遅れを返す', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(60)).toBe('やや遅れ');
  });

  it('50未満は遅刻傾向を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(30)).toBe('遅刻傾向');
  });

  it('100は時間厳守を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(100)).toBe('時間厳守');
  });

  it('0は遅刻傾向を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(0)).toBe('遅刻傾向');
  });
});
