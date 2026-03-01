import { z } from 'zod';

// ===== Users =====
export const createUserProfileSchema = z.object({
  displayName: z.string().min(1, '表示名は必須です').max(100),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Members =====
export const createMemberSchema = z.object({
  name: z.string({ required_error: '名前は必須です' }).min(1, '名前は必須です').max(100),
  memberType: z.enum(['human', 'pet']).optional(),
  petType: z.string().max(50).optional(),
  birthDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  petType: z.string().max(50).optional(),
  birthDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Medications =====
export const createMedicationSchema = z.object({
  name: z.string({ required_error: '薬の名前は必須です' }).min(1, '薬の名前は必須です').max(200),
  memberId: z.string().optional(),
  category: z.string().max(100).optional(),
  dosageAmount: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  stockAlertDate: z.string().optional(),
  instructions: z.string().max(1000).optional(),
});

export const updateStockSchema = z.object({
  stockQuantity: z.number().int().min(0, '在庫数は0以上の数値を指定してください'),
});

// ===== Schedules =====
export const createScheduleSchema = z.object({
  medicationId: z.string().min(1, '薬IDは必須です'),
  memberId: z.string().min(1, 'メンバーIDは必須です'),
  scheduledTime: z.string().min(1, '予定時刻は必須です'),
  daysOfWeek: z.array(z.string()).optional(),
  isEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(0).optional(),
});

export const updateScheduleSchema = z.object({
  scheduledTime: z.string().optional(),
  daysOfWeek: z.array(z.string()).optional(),
  isEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(0).optional(),
});

// ===== Records =====
export const createRecordSchema = z.object({
  memberId: z.string().min(1, 'メンバーIDは必須です'),
  medicationId: z.string().min(1, '薬IDは必須です'),
  scheduleId: z.string().optional(),
  notes: z.string().max(500).optional(),
  dosageAmount: z.string().max(100).optional(),
});

// ===== Hospitals =====
export const createHospitalSchema = z.object({
  name: z.string({ required_error: '病院名は必須です' }).min(1, '病院名は必須です').max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  memberId: z.string().optional(),
});

export const updateHospitalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Appointments =====
export const createAppointmentSchema = z.object({
  memberId: z.string().min(1, 'メンバーIDは必須です'),
  hospitalId: z.string().optional(),
  appointmentDate: z.string().min(1, '予約日は必須です'),
  appointmentTime: z.string().optional(),
  type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).optional(),
});

export const updateAppointmentSchema = z.object({
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Auth =====
export const signUpSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  displayName: z.string().min(1, '表示名は必須です').max(100),
});
