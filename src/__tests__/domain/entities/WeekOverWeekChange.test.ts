import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Week Over Week Change', () => {
  describe('getWeekOverWeekChange', () => {
    it('空配列は0', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([50])).toBe(0);
    });

    it('増加', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([50, 70])).toBe(20);
    });

    it('減少', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([70, 50])).toBe(-20);
    });

    it('変化なし', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([60, 60])).toBe(0);
    });

    it('3件以上は最後2件の差', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([30, 50, 80])).toBe(30);
    });

    it('0から100', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([0, 100])).toBe(100);
    });

    it('100から0', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([100, 0])).toBe(-100);
    });
  });

  describe('getWeekOverWeekLabel', () => {
    it('正の変化は改善', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(15)).toBe('改善');
    });

    it('負の変化は悪化', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(-15)).toBe('悪化');
    });

    it('小さな変化は横ばい', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(3)).toBe('横ばい');
    });

    it('0は横ばい', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(0)).toBe('横ばい');
    });
  });
});
