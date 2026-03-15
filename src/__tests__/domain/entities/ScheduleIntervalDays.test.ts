import { describe, it, expect } from 'vitest';
import { ScheduleEntity, Schedule } from '@/domain/entities/Schedule';

/**
 * 間隔スケジュール(intervalDays)のisActiveOnDayテスト
 * X日ごとの薬（例: 3週間に1回のブラペクト）の判定ロジック検証
 */

const createSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sched-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'mem-1',
  scheduledTime: '08:00',
  daysOfWeek: [],
  isEnabled: true,
  reminderMinutesBefore: 15,
  createdAt: new Date(),
  ...overrides,
});

describe('ScheduleEntity.isActiveOnDay(間隔スケジュール)', () => {
  it('開始日と同日はアクティブ', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 21,
      startDate: new Date('2026-03-01'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(true);
  });

  it('21日後にアクティブ(3週間間隔)', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 21,
      startDate: new Date('2026-03-01'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-22'))).toBe(true);
  });

  it('42日後にアクティブ(3週間間隔x2)', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 21,
      startDate: new Date('2026-03-01'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-04-12'))).toBe(true);
  });

  it('間隔に一致しない日は非アクティブ', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 21,
      startDate: new Date('2026-03-01'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-02'))).toBe(false);
    expect(entity.isActiveOnDay(new Date('2026-03-10'))).toBe(false);
    expect(entity.isActiveOnDay(new Date('2026-03-21'))).toBe(false);
  });

  it('開始日より前は非アクティブ', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 7,
      startDate: new Date('2026-03-15'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-14'))).toBe(false);
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(false);
  });

  it('毎日間隔(intervalDays=1)は毎日アクティブ', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 1,
      startDate: new Date('2026-03-01'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(true);
    expect(entity.isActiveOnDay(new Date('2026-03-02'))).toBe(true);
    expect(entity.isActiveOnDay(new Date('2026-03-15'))).toBe(true);
  });

  it('2日ごと(隔日)の判定', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 2,
      startDate: new Date('2026-03-01'),
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(true);
    expect(entity.isActiveOnDay(new Date('2026-03-02'))).toBe(false);
    expect(entity.isActiveOnDay(new Date('2026-03-03'))).toBe(true);
    expect(entity.isActiveOnDay(new Date('2026-03-04'))).toBe(false);
    expect(entity.isActiveOnDay(new Date('2026-03-05'))).toBe(true);
  });

  it('無効なスケジュールは常に非アクティブ', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 7,
      startDate: new Date('2026-03-01'),
      isEnabled: false,
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(false);
    expect(entity.isActiveOnDay(new Date('2026-03-08'))).toBe(false);
  });

  it('intervalDaysなし・曜日空配列は毎日アクティブ(従来動作)', () => {
    const entity = new ScheduleEntity(createSchedule({
      daysOfWeek: [],
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(true);
    expect(entity.isActiveOnDay(new Date('2026-03-02'))).toBe(true);
  });

  it('intervalDaysなし・曜日指定は指定曜日のみアクティブ(従来動作)', () => {
    // 2026-03-02は月曜日
    const entity = new ScheduleEntity(createSchedule({
      daysOfWeek: ['mon', 'wed', 'fri'],
    }));
    expect(entity.isActiveOnDay(new Date('2026-03-02'))).toBe(true); // 月
    expect(entity.isActiveOnDay(new Date('2026-03-03'))).toBe(false); // 火
    expect(entity.isActiveOnDay(new Date('2026-03-04'))).toBe(true); // 水
  });

  it('intervalDaysあり・startDateなしの場合は曜日フォールバック', () => {
    const entity = new ScheduleEntity(createSchedule({
      intervalDays: 7,
      daysOfWeek: [],
    }));
    // startDateがないので間隔ロジックはスキップされ、曜日ロジック(空=毎日)にフォールバック
    expect(entity.isActiveOnDay(new Date('2026-03-01'))).toBe(true);
    expect(entity.isActiveOnDay(new Date('2026-03-02'))).toBe(true);
  });
});
