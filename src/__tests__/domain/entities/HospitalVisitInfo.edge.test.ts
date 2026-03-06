import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity - Visit Info Edge Cases', () => {
  describe('getLastVisitLabel 境界値', () => {
    const today = new Date('2025-06-15');

    it('27日前は「27日前」を返す', () => {
      const visit = new Date('2025-05-19');
      expect(HospitalEntity.getLastVisitLabel(visit, today)).toBe('27日前');
    });

    it('28日前は「1ヶ月前」を返す', () => {
      const visit = new Date('2025-05-18');
      expect(HospitalEntity.getLastVisitLabel(visit, today)).toBe('1ヶ月前');
    });

    it('31日前は「1ヶ月前」を返す', () => {
      const visit = new Date('2025-05-15');
      expect(HospitalEntity.getLastVisitLabel(visit, today)).toBe('1ヶ月前');
    });

    it('32日前は月数表示になる', () => {
      const visit = new Date('2025-05-14');
      expect(HospitalEntity.getLastVisitLabel(visit, today)).toBe('1ヶ月前');
    });

    it('365日前は「12ヶ月前」を返す', () => {
      const visit = new Date('2024-06-16');
      expect(HospitalEntity.getLastVisitLabel(visit, today)).toBe('12ヶ月前');
    });
  });

  describe('formatVisitFrequency 境界値', () => {
    it('非常に多い回数でも月X回形式', () => {
      expect(HospitalEntity.formatVisitFrequency(30)).toBe('月30回');
    });
  });

  describe('getVisitStatusLevel 境界値', () => {
    it('30日はgood', () => {
      expect(HospitalEntity.getVisitStatusLevel(30)).toBe('good');
    });

    it('31日はwarning', () => {
      expect(HospitalEntity.getVisitStatusLevel(31)).toBe('warning');
    });

    it('90日はwarning', () => {
      expect(HospitalEntity.getVisitStatusLevel(90)).toBe('warning');
    });

    it('91日はalert', () => {
      expect(HospitalEntity.getVisitStatusLevel(91)).toBe('alert');
    });
  });
});
