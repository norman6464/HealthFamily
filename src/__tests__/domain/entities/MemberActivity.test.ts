import { describe, it, expect } from 'vitest';
import { MemberSummaryEntity, MemberSummary } from '@/domain/entities/MemberSummary';

const createSummary = (overrides: Partial<MemberSummary> = {}): MemberSummary => ({
  memberId: 'member-1',
  memberName: '太郎',
  memberType: 'human',
  medicationCount: 3,
  nextAppointmentDate: null,
  ...overrides,
});

describe('MemberSummaryEntity 活動状況', () => {
  describe('hasMedications', () => {
    it('薬が0件ならfalseを返す', () => {
      const entity = new MemberSummaryEntity(createSummary({ medicationCount: 0 }));
      expect(entity.hasMedications()).toBe(false);
    });

    it('薬が1件以上ならtrueを返す', () => {
      const entity = new MemberSummaryEntity(createSummary({ medicationCount: 1 }));
      expect(entity.hasMedications()).toBe(true);
    });

    it('薬が複数件でもtrueを返す', () => {
      const entity = new MemberSummaryEntity(createSummary({ medicationCount: 10 }));
      expect(entity.hasMedications()).toBe(true);
    });
  });

  describe('getActivityLevel', () => {
    it('薬あり・予約ありはactiveを返す', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 3, nextAppointmentDate: '2026-04-01' }),
      );
      expect(entity.getActivityLevel()).toBe('active');
    });

    it('薬あり・予約なしはmoderateを返す', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 2, nextAppointmentDate: null }),
      );
      expect(entity.getActivityLevel()).toBe('moderate');
    });

    it('薬なし・予約ありはmoderateを返す', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 0, nextAppointmentDate: '2026-04-01' }),
      );
      expect(entity.getActivityLevel()).toBe('moderate');
    });

    it('薬なし・予約なしはinactiveを返す', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 0, nextAppointmentDate: null }),
      );
      expect(entity.getActivityLevel()).toBe('inactive');
    });
  });

  describe('getMemberTypeLabel', () => {
    it('humanは「家族」を返す', () => {
      expect(MemberSummaryEntity.getMemberTypeLabel('human')).toBe('家族');
    });

    it('petは「ペット」を返す', () => {
      expect(MemberSummaryEntity.getMemberTypeLabel('pet')).toBe('ペット');
    });

    it('未知の種別はそのまま返す', () => {
      expect(MemberSummaryEntity.getMemberTypeLabel('other')).toBe('other');
    });
  });
});
