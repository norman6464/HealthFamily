import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Adherence Streak', () => {
  describe('getAdherenceStreak', () => {
    it('空配列は0', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([])).toBe(0);
    });

    it('全て達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true, true, true, true])).toBe(4);
    });

    it('全て未達成は0', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([false, false, false])).toBe(0);
    });

    it('末尾から連続達成をカウント', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([false, true, true, true])).toBe(3);
    });

    it('途中で途切れた場合', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true, true, false, true, true])).toBe(2);
    });

    it('1件のみ達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true])).toBe(1);
    });

    it('1件のみ未達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([false])).toBe(0);
    });

    it('末尾が未達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreak([true, true, false])).toBe(0);
    });
  });

  describe('getAdherenceStreakLabel', () => {
    it('0日は未達成', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(0)).toBe('未達成');
    });

    it('3日は継続中', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(3)).toBe('継続中');
    });

    it('7日は好調', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(7)).toBe('好調');
    });

    it('30日は素晴らしい', () => {
      expect(MedicationRecordEntity.getAdherenceStreakLabel(30)).toBe('素晴らしい');
    });
  });
});
