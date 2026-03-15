export interface BodyMeasurement {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly weight?: number;
  readonly height?: number;
  readonly recordedAt: Date;
  readonly notes?: string;
  readonly createdAt: Date;
}
