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
  stockAlertDate?: string;
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

export interface BackendHospital {
  id: string;
  userId: string;
  name: string;
  hospitalType?: string;
  address?: string;
  phoneNumber?: string;
  department?: string;
  doctorName?: string;
  notes?: string;
  createdAt: string;
}

export interface BackendAppointment {
  id: string;
  userId: string;
  memberId: string;
  memberName?: string;
  hospitalId?: string;
  hospitalName?: string;
  appointmentType?: string;
  appointmentDate: string;
  description?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  createdAt: string;
}

export interface BackendRecord {
  id: string;
  userId: string;
  memberId: string;
  memberName?: string;
  medicationId: string;
  medicationName?: string;
  scheduleId?: string;
  takenAt: string;
  notes?: string;
  dosageAmount?: string;
}

export interface BackendVaccination {
  id: string;
  userId: string;
  memberId: string;
  memberName?: string;
  vaccineName: string;
  vaccinatedAt: string;
  nextScheduledDate?: string;
  notes?: string;
  createdAt: string;
}

export interface BackendInsurance {
  id: string;
  userId: string;
  memberId: string;
  memberName?: string;
  insuranceType: string;
  providerName?: string;
  policyNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface BackendExamination {
  id: string;
  userId: string;
  memberId: string;
  memberName?: string;
  examinationType: string;
  examinedAt: string;
  nextScheduledDate?: string;
  notes?: string;
  createdAt: string;
}

export interface BackendHealthLog {
  id: string;
  userId: string;
  memberId: string;
  memberName?: string;
  conditionLevel: number;
  symptoms: string[];
  notes?: string;
  recordedAt: string;
}
