import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity - Visit Statistics Edge Cases', () => {
  describe('getVisitCountByMonth', () => {
    it('年をまたぐ通院', () => {
      const visits = [
        { date: new Date('2025-12-20') },
        { date: new Date('2026-01-10') },
      ];
      const result = HospitalEntity.getVisitCountByMonth(visits);
      expect(result).toEqual({ '2025-12': 1, '2026-01': 1 });
    });

    it('1月は01でゼロパディング', () => {
      const visits = [{ date: new Date('2026-01-15') }];
      const result = HospitalEntity.getVisitCountByMonth(visits);
      expect(result['2026-01']).toBe(1);
    });
  });

  describe('getAverageVisitsPerMonth', () => {
    it('1ヶ月のみ', () => {
      expect(HospitalEntity.getAverageVisitsPerMonth({ '2026-01': 5 })).toBe(5);
    });

    it('小数点1桁に丸める', () => {
      const counts = { '2026-01': 1, '2026-02': 2, '2026-03': 3 };
      expect(HospitalEntity.getAverageVisitsPerMonth(counts)).toBe(2);
    });
  });

  describe('getVisitTrendLabel', () => {
    it('境界値4で「頻繁」', () => {
      expect(HospitalEntity.getVisitTrendLabel(4)).toBe('頻繁');
    });

    it('境界値3.9で「定期的」', () => {
      expect(HospitalEntity.getVisitTrendLabel(3.9)).toBe('定期的');
    });

    it('境界値2で「定期的」', () => {
      expect(HospitalEntity.getVisitTrendLabel(2)).toBe('定期的');
    });

    it('境界値1.9で「少ない」', () => {
      expect(HospitalEntity.getVisitTrendLabel(1.9)).toBe('少ない');
    });

    it('境界値0.1で「少ない」', () => {
      expect(HospitalEntity.getVisitTrendLabel(0.1)).toBe('少ない');
    });
  });
});
