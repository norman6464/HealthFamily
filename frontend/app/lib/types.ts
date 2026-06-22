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

export interface Hospital {
  id: string;
  userId: string;
  name: string;
  hospitalType: string | null;
  address: string | null;
  phoneNumber: string | null;
  department: string | null;
  doctorName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  memberId: string;
  hospitalId: string | null;
  appointmentType: string | null;
  appointmentDate: string;
  description: string | null;
  testResults: string | null;
  cost: number | null;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  createdAt: string;
}

export interface HealthLog {
  id: string;
  userId: string;
  memberId: string;
  conditionLevel: number;
  symptoms: string[];
  notes: string | null;
  recordedAt: string;
}

export interface Vaccination {
  id: string;
  userId: string;
  memberId: string;
  vaccineName: string;
  vaccinatedAt: string;
  nextScheduledDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Examination {
  id: string;
  userId: string;
  memberId: string;
  examinationType: string;
  examinedAt: string;
  nextScheduledDate: string | null;
  notes: string | null;
  imageData: string | null;
  createdAt: string;
}

export interface Insurance {
  id: string;
  userId: string;
  memberId: string;
  insuranceType: string;
  providerName: string | null;
  policyNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Allergy {
  id: string;
  userId: string;
  memberId: string;
  allergenName: string;
  allergyType: string;
  severity: string;
  symptoms: string | null;
  diagnosedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  memberId: string;
  weight: number | null;
  height: number | null;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface TemperatureRecord {
  id: string;
  userId: string;
  memberId: string;
  temperature: number;
  measuredAt: string;
  notes: string | null;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  memberId: string;
  contactName: string;
  phoneNumber: string;
  relationship: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Prescription {
  id: string;
  userId: string;
  memberId: string;
  prescriptionName: string;
  prescribedBy: string | null;
  prescribedAt: string;
  expiresAt: string | null;
  pharmacyName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface NotificationSetting {
  id: string;
  userId: string;
  medicationReminderEnabled: boolean;
  missedMedicationEnabled: boolean;
  appointmentReminderEnabled: boolean;
  lowStockAlertEnabled: boolean;
  defaultReminderMinutesBefore: number;
  defaultAppointmentReminderDaysBefore: number;
  emailNotificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
