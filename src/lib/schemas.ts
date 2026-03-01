import { z } from 'zod';

const dateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: '有効な日付形式で入力してください' },
);

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
  birthDate: dateString.optional(),
  notes: z.string().max(500).optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  petType: z.string().max(50).optional(),
  birthDate: dateString.optional().nullable(),
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
  stockQuantity: z.number().int().min(0).max(99999).optional(),
  stockAlertDate: dateString.optional(),
  instructions: z.string().max(1000).optional(),
});

export const updateMedicationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  dosageAmount: z.string().max(100).optional().nullable(),
  frequency: z.string().max(100).optional().nullable(),
  stockQuantity: z.number().int().min(0).max(99999).optional().nullable(),
  stockAlertDate: dateString.optional().nullable(),
  instructions: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

export const updateStockSchema = z.object({
  stockQuantity: z.number().int().min(0, '在庫数は0以上の数値を指定してください').max(99999),
});

// ===== Schedules =====
const dayOfWeekEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const createScheduleSchema = z.object({
  medicationId: z.string().min(1, '薬IDは必須です'),
  memberId: z.string().min(1, 'メンバーIDは必須です'),
  scheduledTime: z.string().min(1, '予定時刻は必須です'),
  daysOfWeek: z.array(dayOfWeekEnum).optional(),
  isEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(0).max(1440).optional(),
});

export const updateScheduleSchema = z.object({
  scheduledTime: z.string().optional(),
  daysOfWeek: z.array(dayOfWeekEnum).optional(),
  isEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(0).max(1440).optional(),
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
  appointmentDate: dateString,
  appointmentTime: z.string().optional(),
  type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).max(365).optional(),
});

export const updateAppointmentSchema = z.object({
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).max(365).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Auth =====
export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, 'メールアドレスが長すぎます').email('有効なメールアドレスを入力してください'),
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(128, 'パスワードは128文字以内で入力してください')
    .regex(/[a-zA-Z]/, 'パスワードには英字を含めてください')
    .regex(/[0-9]/, 'パスワードには数字を含めてください'),
  displayName: z.string().trim().min(1, '表示名は必須です').max(100),
});
