import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentSpacing エッジケーステスト', () => {
  describe('getAppointmentSpacing', () => {
    it('空配列の場合0を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacing([])).toBe(0);
    });

    it('1要素の場合100を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacing([30])).toBe(100);
    });

    it('全て同じ間隔の場合100を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacing([30, 30, 30])).toBe(100);
    });

    it('全て0の場合100を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacing([0, 0, 0])).toBe(100);
    });

    it('大きなばらつきがある場合低スコアを返す', () => {
      const score = AppointmentEntity.getAppointmentSpacing([1, 100, 1, 100]);
      expect(score).toBeLessThan(50);
    });

    it('2要素で同値の場合100を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacing([14, 14])).toBe(100);
    });

    it('2要素で異なる値の場合100未満を返す', () => {
      const score = AppointmentEntity.getAppointmentSpacing([10, 30]);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });

    it('負の値を含む場合も計算する', () => {
      const score = AppointmentEntity.getAppointmentSpacing([-10, 10]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('大量の均等間隔で100を返す', () => {
      const intervals = Array(100).fill(7);
      expect(AppointmentEntity.getAppointmentSpacing(intervals)).toBe(100);
    });
  });

  describe('getAppointmentSpacingLabel', () => {
    it('境界値: 80は均等を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(80)).toBe('均等');
    });

    it('境界値: 79はやや不均等を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(79)).toBe('やや不均等');
    });

    it('境界値: 50はやや不均等を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(50)).toBe('やや不均等');
    });

    it('境界値: 49は不均等を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(49)).toBe('不均等');
    });

    it('0は不均等を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(0)).toBe('不均等');
    });

    it('100は均等を返す', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(100)).toBe('均等');
    });
  });
});
