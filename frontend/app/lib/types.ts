// Go バックエンドの JSON レスポンスに対応するドメイン型

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  characterType: string;
  characterName: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  userId: string;
  memberType: string;
  name: string;
  petType: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  memberId: string;
  userId: string;
  name: string;
  category: string;
  dosageAmount: string | null;
  frequency: string | null;
  stockQuantity: number | null;
  stockAlertDate: string | null;
  intervalHours: number | null;
  instructions: string | null;
  displayOrder: number;
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  medicationId: string;
  userId: string;
  memberId: string;
  scheduledTime: string;
  daysOfWeek: string[];
  intervalDays: number | null;
  startDate: string | null;
  isEnabled: boolean;
  reminderMinutesBefore: number;
  createdAt: string;
}

export interface TodaySchedule extends Schedule {
  medicationName: string;
  memberName: string;
  memberType: string;
  medicationDisplayOrder: number;
  isCompleted: boolean;
}

export interface MedicationRecord {
  id: string;
  memberId: string;
  medicationId: string;
  userId: string;
  scheduleId: string | null;
  takenAt: string;
  notes: string | null;
  dosageAmount: string | null;
}
