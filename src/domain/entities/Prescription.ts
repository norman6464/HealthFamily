export interface Prescription {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly prescriptionName: string;
  readonly prescribedBy?: string;
  readonly prescribedAt: Date;
  readonly expiresAt?: Date;
  readonly pharmacyName?: string;
  readonly notes?: string;
  readonly createdAt: Date;
}
