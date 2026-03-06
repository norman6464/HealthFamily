import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Adherence Streak Edge Cases', () => {
  describe('getAdherenceStreak', () => {
    it('大量の連続達成', () => {
      const results = Array.from({ length: 365 }, () => true);
      expect(MedicationRecordEntity.getAdherenceStreak(results)).toBe(365);
    });

    it('大量データで末尾1件のみ未達成', () => {
      const results = Array.from({ length: 99 }, () => true);
      results.push(false);
      expect(MedicationRecordEntity.getAdherenceStreak(results)).toBe(0);
    });

    it('大量データで先頭のみ未達成', () => {
      const results = [false, ...Array.from({ length: 99 }, () => true)];
      expect(MedicationRecordEntity.getAdherenceStreak(results)).toBe(99);
    });

    it('交互パターン', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true, false, true, false, true])).toBe(1);
    });

    it('2件で両方達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true, true])).toBe(2);
    });

    it('2件で先頭のみ達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true, false])).toBe(0);
    });
  });

  describe('getAdherenceStreakLabel', () => {
    it('1日は継続中', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(1)).toBe('継続中');
    });

    it('6日は継続中', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(6)).toBe('継続中');
    });

    it('7日は好調（閾値境界）', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(7)).toBe('好調');
    });

    it('29日は好調', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(29)).toBe('好調');
    });

    it('30日は素晴らしい（閾値境界）', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(30)).toBe('素晴らしい');
    });

    it('365日は素晴らしい', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(365)).toBe('素晴らしい');
    });
  });
});
