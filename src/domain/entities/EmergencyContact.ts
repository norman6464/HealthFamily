export interface EmergencyContact {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly contactName: string;
  readonly phoneNumber: string;
  readonly relationship?: string;
  readonly notes?: string;
  readonly createdAt: Date;
}
