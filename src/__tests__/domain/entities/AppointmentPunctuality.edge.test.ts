import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity.getAppointmentPunctuality - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([])).toBe(0);
  });

  it('全て0分遅延なら100を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([0, 0, 0])).toBe(100);
  });

  it('1件のみ0分遅延なら100を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([0])).toBe(100);
  });

  it('全て30分遅延なら0を返す', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([30, 30, 30])).toBe(0);
  });

  it('30分超の遅延でも0未満にならない', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([60, 90, 120])).toBe(0);
  });

  it('負の値(早着)は絶対値で計算する', () => {
    const result = AppointmentEntity.getAppointmentPunctuality([-10, -5, -15]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('正負混在でも正しく計算する', () => {
    const result = AppointmentEntity.getAppointmentPunctuality([-5, 0, 5]);
    // avg abs = (5+0+5)/3 = 3.33 -> 100 - (3.33/30)*100 = 88.9 -> 89
    expect(result).toBe(89);
  });

  it('平均遅延15分ならスコア50', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([15])).toBe(50);
  });

  it('平均遅延6分ならスコア80', () => {
    expect(AppointmentEntity.getAppointmentPunctuality([6])).toBe(80);
  });

  it('大量データでも正しく計算する', () => {
    const delays = Array(100).fill(10);
    const result = AppointmentEntity.getAppointmentPunctuality(delays);
    // avg=10, 100-(10/30)*100 = 66.7 -> 67
    expect(result).toBe(67);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = AppointmentEntity.getAppointmentPunctuality([0]);
    const result2 = AppointmentEntity.getAppointmentPunctuality([100]);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
  });

  it('小数分の遅延も正しく処理する', () => {
    const result = AppointmentEntity.getAppointmentPunctuality([0.5, 1.5, 2.5]);
    expect(result).toBeGreaterThan(90);
  });
});

describe('AppointmentEntity.getAppointmentPunctualityLabel - 境界値', () => {
  it('スコア100は時間厳守', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(100)).toBe('時間厳守');
  });

  it('スコア80は時間厳守(境界値)', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(80)).toBe('時間厳守');
  });

  it('スコア79はやや遅れ', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(79)).toBe('やや遅れ');
  });

  it('スコア50はやや遅れ(境界値)', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(50)).toBe('やや遅れ');
  });

  it('スコア49は遅刻傾向', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(49)).toBe('遅刻傾向');
  });

  it('スコア0は遅刻傾向', () => {
    expect(AppointmentEntity.getAppointmentPunctualityLabel(0)).toBe('遅刻傾向');
  });
});
