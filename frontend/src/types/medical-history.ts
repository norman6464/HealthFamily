export type HistoryType =
  | 'chronic'
  | 'major_illness'
  | 'hospitalization'
  | 'surgery'
  | 'allergy'
  | 'side_effect';

export interface MedicalHistory {
  historyId: string;
  memberId: string;
  userId: string;
  historyType: HistoryType;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  createdAt: string;
}
