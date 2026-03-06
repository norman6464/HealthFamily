import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity 服薬間隔チェック', () => {
  describe('getTimeBetweenDoses', () => {
    it('同時刻は0分を返す', () => {
      const t = new Date('2026-03-05T08:00:00');
      expect(MedicationRecordEntity.getTimeBetweenDoses(t, t)).toBe(0);
    });

    it('1時間差は60分を返す', () => {
      const t1 = new Date('2026-03-05T08:00:00');
      const t2 = new Date('2026-03-05T09:00:00');
      expect(MedicationRecordEntity.getTimeBetweenDoses(t1, t2)).toBe(60);
    });

    it('順序に関わらず正の値を返す', () => {
      const t1 = new Date('2026-03-05T10:00:00');
      const t2 = new Date('2026-03-05T08:00:00');
      expect(MedicationRecordEntity.getTimeBetweenDoses(t1, t2)).toBe(120);
    });

    it('日をまたぐ場合も正しく算出する', () => {
      const t1 = new Date('2026-03-05T23:00:00');
      const t2 = new Date('2026-03-06T01:00:00');
      expect(MedicationRecordEntity.getTimeBetweenDoses(t1, t2)).toBe(120);
    });
  });

  describe('isMinIntervalMet', () => {
    it('間隔が最小値以上ならtrueを返す', () => {
      expect(MedicationRecordEntity.isMinIntervalMet(240, 240)).toBe(true);
    });

    it('間隔が最小値未満ならfalseを返す', () => {
      expect(MedicationRecordEntity.isMinIntervalMet(100, 240)).toBe(false);
    });

    it('間隔0で最小0ならtrueを返す', () => {
      expect(MedicationRecordEntity.isMinIntervalMet(0, 0)).toBe(true);
    });
  });

  describe('getIntervalWarning', () => {
    it('間隔が十分な場合はnullを返す', () => {
      expect(MedicationRecordEntity.getIntervalWarning(300, 240)).toBeNull();
    });

    it('間隔が不十分な場合は警告メッセージを返す', () => {
      const msg = MedicationRecordEntity.getIntervalWarning(100, 240);
      expect(msg).not.toBeNull();
      expect(msg).toContain('4時間');
    });

    it('最小間隔60分で30分の場合は1時間の警告を返す', () => {
      const msg = MedicationRecordEntity.getIntervalWarning(30, 60);
      expect(msg).toContain('1時間');
    });

    it('最小間隔30分で10分の場合は30分の警告を返す', () => {
      const msg = MedicationRecordEntity.getIntervalWarning(10, 30);
      expect(msg).toContain('30分');
    });
  });
});
