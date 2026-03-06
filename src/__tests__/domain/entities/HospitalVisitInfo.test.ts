import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity 通院情報表示', () => {
  describe('formatVisitFrequency', () => {
    it('月1回は毎月を返す', () => {
      expect(HospitalEntity.formatVisitFrequency(1)).toBe('毎月');
    });

    it('月2回は月2回を返す', () => {
      expect(HospitalEntity.formatVisitFrequency(2)).toBe('月2回');
    });

    it('月0回は不定期を返す', () => {
      expect(HospitalEntity.formatVisitFrequency(0)).toBe('不定期');
    });

    it('月4回は週1回を返す', () => {
      expect(HospitalEntity.formatVisitFrequency(4)).toBe('週1回');
    });
  });

  describe('getLastVisitLabel', () => {
    it('今日の場合は今日を返す', () => {
      const today = new Date(2026, 2, 5);
      expect(HospitalEntity.getLastVisitLabel(today, today)).toBe('今日');
    });

    it('1日前は昨日を返す', () => {
      const today = new Date(2026, 2, 5);
      const lastVisit = new Date(2026, 2, 4);
      expect(HospitalEntity.getLastVisitLabel(lastVisit, today)).toBe('昨日');
    });

    it('7日前は1週間前を返す', () => {
      const today = new Date(2026, 2, 10);
      const lastVisit = new Date(2026, 2, 3);
      expect(HospitalEntity.getLastVisitLabel(lastVisit, today)).toBe('1週間前');
    });

    it('30日前は1ヶ月前を返す', () => {
      const today = new Date(2026, 2, 10);
      const lastVisit = new Date(2026, 1, 8);
      expect(HospitalEntity.getLastVisitLabel(lastVisit, today)).toBe('1ヶ月前');
    });

    it('3日前は3日前を返す', () => {
      const today = new Date(2026, 2, 10);
      const lastVisit = new Date(2026, 2, 7);
      expect(HospitalEntity.getLastVisitLabel(lastVisit, today)).toBe('3日前');
    });
  });

  describe('getVisitStatusLevel', () => {
    it('30日以内はgoodを返す', () => {
      expect(HospitalEntity.getVisitStatusLevel(15)).toBe('good');
    });

    it('90日以内はwarningを返す', () => {
      expect(HospitalEntity.getVisitStatusLevel(60)).toBe('warning');
    });

    it('90日超はalertを返す', () => {
      expect(HospitalEntity.getVisitStatusLevel(120)).toBe('alert');
    });

    it('0日はgoodを返す', () => {
      expect(HospitalEntity.getVisitStatusLevel(0)).toBe('good');
    });
  });
});
