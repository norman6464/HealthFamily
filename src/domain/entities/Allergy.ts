export interface Allergy {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly allergenName: string;
  readonly allergyType: string;
  readonly severity: string;
  readonly symptoms?: string;
  readonly diagnosedAt?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
}
