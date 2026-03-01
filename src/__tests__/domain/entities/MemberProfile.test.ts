import { describe, it, expect } from 'vitest';
import { MemberProfileEntity, MemberProfile } from '@/domain/entities/MemberProfile';

const createProfile = (overrides: Partial<MemberProfile> = {}): MemberProfile => ({
  member: {
    id: 'member-1',
    userId: 'user-1',
    name: '太郎',
    memberType: 'human',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  medicationCount: 3,
  activeScheduleCount: 5,
  upcomingAppointmentCount: 2,
  recentAdherenceRate: 85,
  ...overrides,
});

describe('MemberProfileEntity', () => {
  it('dataがプロフィールデータを返す', () => {
    const profile = createProfile();
    const entity = new MemberProfileEntity(profile);
    expect(entity.data.member.name).toBe('太郎');
  });

  it('服薬率が高い場合getAdherenceLabelが良好を返す', () => {
    const entity = new MemberProfileEntity(createProfile({ recentAdherenceRate: 90 }));
    expect(entity.getAdherenceLabel()).toBe('良好');
  });

  it('服薬率が中程度の場合getAdherenceLabelが注意を返す', () => {
    const entity = new MemberProfileEntity(createProfile({ recentAdherenceRate: 60 }));
    expect(entity.getAdherenceLabel()).toBe('注意');
  });

  it('服薬率が低い場合getAdherenceLabelが要改善を返す', () => {
    const entity = new MemberProfileEntity(createProfile({ recentAdherenceRate: 40 }));
    expect(entity.getAdherenceLabel()).toBe('要改善');
  });

  it('服薬率がnullの場合getAdherenceLabelが空文字を返す', () => {
    const entity = new MemberProfileEntity(createProfile({ recentAdherenceRate: null }));
    expect(entity.getAdherenceLabel()).toBe('');
  });

  it('hasMedicationsが正しく動作する', () => {
    expect(new MemberProfileEntity(createProfile({ medicationCount: 3 })).hasMedications()).toBe(true);
    expect(new MemberProfileEntity(createProfile({ medicationCount: 0 })).hasMedications()).toBe(false);
  });
});
