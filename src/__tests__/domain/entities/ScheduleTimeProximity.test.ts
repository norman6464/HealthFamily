import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 時間近接検出', () => {
  describe('getTimeDiffMinutes', () => {
    it('同じ時刻は0分を返す', () => {
      expect(ScheduleEntity.getTimeDiffMinutes('08:00', '08:00')).toBe(0);
    });

    it('30分差を正しく返す', () => {
      expect(ScheduleEntity.getTimeDiffMinutes('08:00', '08:30')).toBe(30);
    });

    it('順序を逆にしても同じ結果(絶対値)', () => {
      expect(ScheduleEntity.getTimeDiffMinutes('08:30', '08:00')).toBe(30);
    });

    it('時間をまたぐ差を正しく計算する', () => {
      expect(ScheduleEntity.getTimeDiffMinutes('08:45', '09:15')).toBe(30);
    });

    it('大きな差を正しく計算する', () => {
      expect(ScheduleEntity.getTimeDiffMinutes('08:00', '20:00')).toBe(720);
    });

    it('深夜と早朝の差を正しく計算する', () => {
      expect(ScheduleEntity.getTimeDiffMinutes('00:00', '23:59')).toBe(1439);
    });
  });

  describe('isTimeClose', () => {
    it('差が閾値未満なら近接と判定する', () => {
      expect(ScheduleEntity.isTimeClose('08:00', '08:25', 30)).toBe(true);
    });

    it('差がちょうど閾値なら近接と判定する(境界)', () => {
      expect(ScheduleEntity.isTimeClose('08:00', '08:30', 30)).toBe(true);
    });

    it('差が閾値を超えたら近接でないと判定する', () => {
      expect(ScheduleEntity.isTimeClose('08:00', '08:31', 30)).toBe(false);
    });

    it('デフォルト閾値(30分)で動作する', () => {
      expect(ScheduleEntity.isTimeClose('08:00', '08:29')).toBe(true);
      expect(ScheduleEntity.isTimeClose('08:00', '08:31')).toBe(false);
    });

    it('同じ時刻は常に近接と判定する', () => {
      expect(ScheduleEntity.isTimeClose('12:00', '12:00', 1)).toBe(true);
    });
  });

  describe('getTimeProximityLevel', () => {
    it('15分以内はwarningを返す', () => {
      expect(ScheduleEntity.getTimeProximityLevel(10)).toBe('warning');
    });

    it('ちょうど15分はwarningを返す(境界)', () => {
      expect(ScheduleEntity.getTimeProximityLevel(15)).toBe('warning');
    });

    it('16分はinfoを返す', () => {
      expect(ScheduleEntity.getTimeProximityLevel(16)).toBe('info');
    });

    it('30分はinfoを返す(境界)', () => {
      expect(ScheduleEntity.getTimeProximityLevel(30)).toBe('info');
    });

    it('31分はnoneを返す', () => {
      expect(ScheduleEntity.getTimeProximityLevel(31)).toBe('none');
    });

    it('0分はwarningを返す', () => {
      expect(ScheduleEntity.getTimeProximityLevel(0)).toBe('warning');
    });

    it('60分以上はnoneを返す', () => {
      expect(ScheduleEntity.getTimeProximityLevel(60)).toBe('none');
    });
  });
});
