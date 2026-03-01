/**
 * メンバープロフィールエンティティ
 * メンバーの詳細情報と統計をまとめたビューモデル
 */

import { Member } from './Member';

export interface MemberProfile {
  readonly member: Member;
  readonly medicationCount: number;
  readonly activeScheduleCount: number;
  readonly upcomingAppointmentCount: number;
  readonly recentAdherenceRate: number | null;
}

export class MemberProfileEntity {
  constructor(private readonly profile: MemberProfile) {}

  get data(): MemberProfile {
    return this.profile;
  }

  hasMedications(): boolean {
    return this.profile.medicationCount > 0;
  }

  getAdherenceLabel(): string {
    if (this.profile.recentAdherenceRate === null) return '';
    if (this.profile.recentAdherenceRate >= 80) return '良好';
    if (this.profile.recentAdherenceRate >= 50) return '注意';
    return '要改善';
  }
}
