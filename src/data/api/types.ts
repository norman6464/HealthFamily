export interface BackendMember {
  id: string;
  userId: string;
  name: string;
  memberType?: string;
  petType?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendMedication {
  id: string;
  memberId: string;
  userId: string;
  name: string;
  category?: string;
  dosageAmount?: string;
  frequency?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  instructions?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSchedule {
  id: string;
  medicationId: string;
  userId: string;
  memberId: string;
  scheduledTime: string;
  daysOfWeek?: string[];
  isEnabled?: boolean;
  reminderMinutesBefore?: number;
  createdAt: string;
}

export interface BackendRecord {
  id: string;
  userId: string;
  memberId: string;
  medicationId: string;
  scheduleId?: string;
  takenAt: string;
  notes?: string;
  dosageAmount?: string;
}
