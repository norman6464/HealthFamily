import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Time Slot', () => {
  describe('getScheduleDensity', () => {
    it('0件は「なし」を返す', () => {
      expect(ScheduleEntity.getScheduleDensity(0)).toBe('none');
    });

    it('1件は「低」を返す', () => {
      expect(ScheduleEntity.getScheduleDensity(1)).toBe('low');
    });

    it('3件は「低」を返す', () => {
      expect(ScheduleEntity.getScheduleDensity(3)).toBe('low');
    });

    it('4件は「中」を返す', () => {
      expect(ScheduleEntity.getScheduleDensity(4)).toBe('medium');
    });

    it('6件は「中」を返す', () => {
      expect(ScheduleEntity.getScheduleDensity(6)).toBe('medium');
    });

    it('7件は「高」を返す', () => {
      expect(ScheduleEntity.getScheduleDensity(7)).toBe('high');
    });
  });

  describe('hasTimeOverlap', () => {
    it('同じ時刻は重複', () => {
      expect(ScheduleEntity.hasTimeOverlap('08:00', '08:00', 30)).toBe(true);
    });

    it('30分以内は重複', () => {
      expect(ScheduleEntity.hasTimeOverlap('08:00', '08:20', 30)).toBe(true);
    });

    it('30分ちょうどは重複', () => {
      expect(ScheduleEntity.hasTimeOverlap('08:00', '08:30', 30)).toBe(true);
    });

    it('31分は非重複', () => {
      expect(ScheduleEntity.hasTimeOverlap('08:00', '08:31', 30)).toBe(false);
    });

    it('大きく離れた時刻は非重複', () => {
      expect(ScheduleEntity.hasTimeOverlap('08:00', '20:00', 30)).toBe(false);
    });
  });

  describe('getOptimalTimeSuggestion', () => {
    it('既存スケジュールなしの場合08:00を返す', () => {
      expect(ScheduleEntity.getOptimalTimeSuggestion([])).toBe('08:00');
    });

    it('朝のみの場合は夜を提案', () => {
      const result = ScheduleEntity.getOptimalTimeSuggestion(['08:00']);
      expect(result).toBe('20:00');
    });

    it('朝と夜の場合は昼を提案', () => {
      const result = ScheduleEntity.getOptimalTimeSuggestion(['08:00', '20:00']);
      expect(result).toBe('14:00');
    });
  });
});
