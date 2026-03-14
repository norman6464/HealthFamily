export interface Vaccination {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly vaccineName: string;
  readonly vaccinatedAt: Date;
  readonly nextScheduledDate?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
}
