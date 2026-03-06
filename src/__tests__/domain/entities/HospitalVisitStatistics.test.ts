import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity - Visit Statistics', () => {
  describe('getVisitCountByMonth', () => {
    it('月別通院回数を集計する', () => {
      const visits = [
        { date: new Date('2026-01-10') },
        { date: new Date('2026-01-20') },
        { date: new Date('2026-02-15') },
      ];
      const result = HospitalEntity.getVisitCountByMonth(visits);
      expect(result).toEqual({ '2026-01': 2, '2026-02': 1 });
    });

    it('空配列は空オブジェクトを返す', () => {
      expect(HospitalEntity.getVisitCountByMonth([])).toEqual({});
    });

    it('同月に複数回', () => {
      const visits = [
        { date: new Date('2026-03-01') },
        { date: new Date('2026-03-15') },
        { date: new Date('2026-03-28') },
      ];
      const result = HospitalEntity.getVisitCountByMonth(visits);
      expect(result).toEqual({ '2026-03': 3 });
    });
  });

  describe('getAverageVisitsPerMonth', () => {
    it('3ヶ月で6回なら月平均2回', () => {
      const monthlyCounts = { '2026-01': 2, '2026-02': 2, '2026-03': 2 };
      expect(HospitalEntity.getAverageVisitsPerMonth(monthlyCounts)).toBe(2);
    });

    it('2ヶ月で3回なら月平均1.5回', () => {
      const monthlyCounts = { '2026-01': 1, '2026-02': 2 };
      expect(HospitalEntity.getAverageVisitsPerMonth(monthlyCounts)).toBe(1.5);
    });

    it('空オブジェクトで0を返す', () => {
      expect(HospitalEntity.getAverageVisitsPerMonth({})).toBe(0);
    });

    it('小数点1桁に丸める', () => {
      const monthlyCounts = { '2026-01': 1, '2026-02': 2, '2026-03': 3 };
      expect(HospitalEntity.getAverageVisitsPerMonth(monthlyCounts)).toBe(2);
    });
  });

  describe('getVisitTrendLabel', () => {
    it('月4回以上で「頻繁」', () => {
      expect(HospitalEntity.getVisitTrendLabel(4)).toBe('頻繁');
    });

    it('月2回で「定期的」', () => {
      expect(HospitalEntity.getVisitTrendLabel(2)).toBe('定期的');
    });

    it('月1回で「少ない」', () => {
      expect(HospitalEntity.getVisitTrendLabel(1)).toBe('少ない');
    });

    it('月0回で「通院なし」', () => {
      expect(HospitalEntity.getVisitTrendLabel(0)).toBe('通院なし');
    });

    it('月0.5回で「少ない」', () => {
      expect(HospitalEntity.getVisitTrendLabel(0.5)).toBe('少ない');
    });
  });
});
