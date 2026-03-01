import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemberSummaryEntity, MemberSummary } from '@/domain/entities/MemberSummary';

const createSummary = (overrides: Partial<MemberSummary> = {}): MemberSummary => ({
  memberId: 'member-1',
  memberName: '太郎',
  memberType: 'human',
  medicationCount: 3,
  nextAppointmentDate: null,
  ...overrides,
});

describe('MemberSummaryEntity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('予約なしの場合hasUpcomingAppointmentがfalseを返す', () => {
    const entity = new MemberSummaryEntity(createSummary());
    expect(entity.hasUpcomingAppointment()).toBe(false);
  });

  it('予約ありの場合hasUpcomingAppointmentがtrueを返す', () => {
    const entity = new MemberSummaryEntity(createSummary({ nextAppointmentDate: '2026-12-01T00:00:00Z' }));
    expect(entity.hasUpcomingAppointment()).toBe(true);
  });

  it('予約なしの場合getDaysUntilAppointmentがnullを返す', () => {
    const entity = new MemberSummaryEntity(createSummary());
    expect(entity.getDaysUntilAppointment()).toBeNull();
  });

  it('今日の予約の場合getAppointmentLabelが今日を返す', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 2, 1, 10, 0, 0); // 2026-03-01 10:00 local
    vi.setSystemTime(now);
    const todayStr = new Date(2026, 2, 1, 14, 0, 0).toISOString();
    const entity = new MemberSummaryEntity(createSummary({ nextAppointmentDate: todayStr }));
    expect(entity.getAppointmentLabel()).toBe('今日');
  });

  it('明日の予約の場合getAppointmentLabelが明日を返す', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 2, 1, 10, 0, 0);
    vi.setSystemTime(now);
    const tomorrowStr = new Date(2026, 2, 2, 14, 0, 0).toISOString();
    const entity = new MemberSummaryEntity(createSummary({ nextAppointmentDate: tomorrowStr }));
    expect(entity.getAppointmentLabel()).toBe('明日');
  });

  it('複数日後の予約の場合日数を返す', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 2, 1, 10, 0, 0);
    vi.setSystemTime(now);
    const futureStr = new Date(2026, 2, 6, 14, 0, 0).toISOString();
    const entity = new MemberSummaryEntity(createSummary({ nextAppointmentDate: futureStr }));
    expect(entity.getAppointmentLabel()).toBe('5日後');
  });

  it('予約なしの場合getAppointmentLabelが空文字を返す', () => {
    const entity = new MemberSummaryEntity(createSummary());
    expect(entity.getAppointmentLabel()).toBe('');
  });

  it('dataがサマリーデータを返す', () => {
    const summary = createSummary({ memberName: '花子' });
    const entity = new MemberSummaryEntity(summary);
    expect(entity.data.memberName).toBe('花子');
  });
});
