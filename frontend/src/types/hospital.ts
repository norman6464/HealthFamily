export type HospitalType = 'human' | 'animal';

export interface Hospital {
  hospitalId: string;
  userId: string;
  name: string;
  hospitalType: HospitalType;
  address?: string;
  phoneNumber?: string;
  department?: string;
  notes?: string;
  createdAt: string;
}
