import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity 服薬間隔 エッジケース', () => {
  describe('getTimeBetweenDoses', () => {
    it('数日離れた時刻の差を正しく算出する', () => {
      const t1 = new Date('2026-03-01T08:00:00');
      const t2 = new Date('2026-03-03T08:00:00');
      expect(MedicationRecordEntity.getTimeBetweenDoses(t1, t2)).toBe(2880);
    });

    it('秒単位の差は切り捨てされない（分に変換）', () => {
      const t1 = new Date('2026-03-05T08:00:00');
      const t2 = new Date('2026-03-05T08:30:30');
      expect(MedicationRecordEntity.getTimeBetweenDoses(t1, t2)).toBe(30.5);
    });
  });

  describe('isMinIntervalMet', () => {
    it('小数の間隔で正しく判定する', () => {
      expect(MedicationRecordEntity.isMinIntervalMet(30.5, 30)).toBe(true);
      expect(MedicationRecordEntity.isMinIntervalMet(29.9, 30)).toBe(false);
    });
  });

  describe('getIntervalWarning', () => {
    it('90分は1時間30分の警告を返す', () => {
      const msg = MedicationRecordEntity.getIntervalWarning(10, 90);
      expect(msg).toContain('1時間30分');
    });

    it('ちょうど間隔を満たす場合はnullを返す', () => {
      expect(MedicationRecordEntity.getIntervalWarning(240, 240)).toBeNull();
    });

    it('1分差でも不足なら警告を返す', () => {
      const msg = MedicationRecordEntity.getIntervalWarning(239, 240);
      expect(msg).not.toBeNull();
    });
  });
});
