import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemberSummaryEntity, MemberSummary } from '@/domain/entities/MemberSummary';

const createSummary = (overrides: Partial<MemberSummary> = {}): MemberSummary => ({
  memberId: 'member-1',
  memberName: '太郎',
  memberType: 'human',
  medicationCount: 0,
  nextAppointmentDate: null,
  ...overrides,
});

describe('MemberSummaryEntity エッジケーステスト', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAppointmentLabel 境界値', () => {
    it('予約なしは空文字を返す', () => {
      const entity = new MemberSummaryEntity(createSummary());
      expect(entity.getAppointmentLabel()).toBe('');
    });

    it('今日の予約は「今日」を返す', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05T10:00:00'));
      const entity = new MemberSummaryEntity(
        createSummary({ nextAppointmentDate: '2026-03-05' }),
      );
      expect(entity.getAppointmentLabel()).toBe('今日');
    });

    it('明日の予約は「明日」を返す', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05T10:00:00'));
      const entity = new MemberSummaryEntity(
        createSummary({ nextAppointmentDate: '2026-03-06' }),
      );
      expect(entity.getAppointmentLabel()).toBe('明日');
    });

    it('2日後の予約は「2日後」を返す', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05T10:00:00'));
      const entity = new MemberSummaryEntity(
        createSummary({ nextAppointmentDate: '2026-03-07' }),
      );
      expect(entity.getAppointmentLabel()).toBe('2日後');
    });

    it('30日後の予約は「30日後」を返す', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05T10:00:00'));
      const entity = new MemberSummaryEntity(
        createSummary({ nextAppointmentDate: '2026-04-04' }),
      );
      expect(entity.getAppointmentLabel()).toBe('30日後');
    });
  });

  describe('hasUpcomingAppointment', () => {
    it('予約ありはtrueを返す', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ nextAppointmentDate: '2026-04-01' }),
      );
      expect(entity.hasUpcomingAppointment()).toBe(true);
    });

    it('予約なしはfalseを返す', () => {
      const entity = new MemberSummaryEntity(createSummary());
      expect(entity.hasUpcomingAppointment()).toBe(false);
    });
  });

  describe('getActivityLevel 全組合せ', () => {
    it('薬0・予約なし → inactive', () => {
      const entity = new MemberSummaryEntity(createSummary({ medicationCount: 0 }));
      expect(entity.getActivityLevel()).toBe('inactive');
    });

    it('薬1・予約なし → moderate', () => {
      const entity = new MemberSummaryEntity(createSummary({ medicationCount: 1 }));
      expect(entity.getActivityLevel()).toBe('moderate');
    });

    it('薬0・予約あり → moderate', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 0, nextAppointmentDate: '2026-04-01' }),
      );
      expect(entity.getActivityLevel()).toBe('moderate');
    });

    it('薬1・予約あり → active', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 1, nextAppointmentDate: '2026-04-01' }),
      );
      expect(entity.getActivityLevel()).toBe('active');
    });

    it('薬10・予約あり → active', () => {
      const entity = new MemberSummaryEntity(
        createSummary({ medicationCount: 10, nextAppointmentDate: '2026-04-01' }),
      );
      expect(entity.getActivityLevel()).toBe('active');
    });
  });

  describe('getMemberTypeLabel 境界値', () => {
    it('humanは家族を返す', () => {
      expect(MemberSummaryEntity.getMemberTypeLabel('human')).toBe('家族');
    });

    it('petはペットを返す', () => {
      expect(MemberSummaryEntity.getMemberTypeLabel('pet')).toBe('ペット');
    });

    it('空文字はそのまま返す', () => {
      expect(MemberSummaryEntity.getMemberTypeLabel('')).toBe('');
    });
  });
});
