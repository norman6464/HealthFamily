export interface Examination {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly examinationType: string;
  readonly examinedAt: Date;
  readonly nextScheduledDate?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
}
