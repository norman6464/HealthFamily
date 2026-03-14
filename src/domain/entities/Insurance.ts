export interface Insurance {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly insuranceType: string;
  readonly providerName?: string;
  readonly policyNumber?: string;
  readonly notes?: string;
  readonly createdAt: Date;
}
