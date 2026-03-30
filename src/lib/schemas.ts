import { z } from 'zod';

const dateString = z.string().trim().max(50, '日付形式が長すぎます').refine(
  (val) => !isNaN(Date.parse(val)),
  { message: '有効な日付形式で入力してください' },
);

const idField = z.string().trim().min(1).max(50);
const optionalIdField = z.string().trim().max(50).optional();

// ===== Users =====
export const createUserProfileSchema = z.object({
  displayName: z.string().trim().min(1, '表示名は必須です').max(100),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Members =====
export const createMemberSchema = z.object({
  name: z.string({ required_error: '名前は必須です' }).trim().min(1, '名前は必須です').max(100),
  memberType: z.enum(['human', 'pet']).optional(),
  petType: z.string().trim().max(50).optional(),
  birthDate: dateString.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  petType: z.string().trim().max(50).optional(),
  birthDate: dateString.optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Medications =====
export const createMedicationSchema = z.object({
  name: z.string({ required_error: '薬の名前は必須です' }).trim().min(1, '薬の名前は必須です').max(200),
  memberId: optionalIdField,
  category: z.string().trim().max(100).optional(),
  dosageAmount: z.string().trim().max(100).optional(),
  frequency: z.string().trim().max(100).optional(),
  stockQuantity: z.number().int().min(0).max(99999).optional(),
  stockAlertDate: dateString.optional(),
  instructions: z.string().trim().max(1000).optional(),
});

export const updateMedicationSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().max(100).optional(),
  dosageAmount: z.string().trim().max(100).optional().nullable(),
  frequency: z.string().trim().max(100).optional().nullable(),
  stockQuantity: z.number().int().min(0).max(99999).optional().nullable(),
  stockAlertDate: dateString.optional().nullable(),
  instructions: z.string().trim().max(1000).optional().nullable(),
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
  medicationId: idField,
  memberId: idField,
  scheduledTime: z.string().trim().min(1, '予定時刻は必須です').max(10),
  daysOfWeek: z.array(dayOfWeekEnum).optional(),
  intervalDays: z.number().int().min(-1).max(365).refine((v) => v !== 0, { message: '間隔日数は0以外を指定してください' }).optional(),
  startDate: dateString.optional(),
  isEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(0).max(1440).optional(),
});

export const updateScheduleSchema = z.object({
  scheduledTime: z.string().trim().min(1, '予定時刻は必須です').max(10).optional(),
  daysOfWeek: z.array(dayOfWeekEnum).optional(),
  intervalDays: z.number().int().min(-1).max(365).refine((v) => v !== 0, { message: '間隔日数は0以外を指定してください' }).optional().nullable(),
  startDate: dateString.optional().nullable(),
  isEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(0).max(1440).optional(),
});

// ===== Records =====
export const createRecordSchema = z.object({
  memberId: idField,
  medicationId: idField,
  scheduleId: optionalIdField,
  notes: z.string().trim().max(500).optional(),
  dosageAmount: z.string().trim().max(100).optional(),
  takenAt: z.string().datetime().optional(),
});

export const updateRecordSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Hospitals =====
export const createHospitalSchema = z.object({
  name: z.string({ required_error: '病院名は必須です' }).trim().min(1, '病院名は必須です').max(200),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  type: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  doctorName: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  memberId: optionalIdField,
});

export const updateHospitalSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  type: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  doctorName: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Appointments =====
export const createAppointmentSchema = z.object({
  memberId: idField,
  hospitalId: optionalIdField,
  appointmentDate: dateString,
  appointmentTime: z.string().trim().max(10).optional(),
  type: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).max(365).optional(),
});

export const updateAppointmentSchema = z.object({
  appointmentDate: dateString.optional(),
  hospitalId: z.string().trim().max(50).optional().nullable(),
  appointmentTime: z.string().trim().max(10).optional(),
  type: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(0).max(365).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Health Logs =====
export const createHealthLogSchema = z.object({
  memberId: idField,
  conditionLevel: z.number().int().min(1, '体調レベルは1以上を指定してください').max(5, '体調レベルは5以下を指定してください'),
  symptoms: z.array(z.enum(['headache', 'fever', 'fatigue', 'nausea', 'stomachache', 'dizziness', 'cough', 'runny_nose', 'joint_pain', 'insomnia', 'menstrual_pain', 'vomiting', 'diarrhea', 'bloody_urine', 'bleeding', 'eye_discharge', 'loss_of_appetite', 'lethargy'])).max(10).optional(),
  notes: z.string().trim().max(500).optional(),
});

// ===== Vaccinations =====
export const createVaccinationSchema = z.object({
  memberId: idField,
  vaccineName: z.string({ required_error: 'ワクチンの種類は必須です' }).trim().min(1, 'ワクチンの種類は必須です').max(200),
  vaccinatedAt: dateString,
  nextScheduledDate: dateString.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateVaccinationSchema = z.object({
  vaccineName: z.string().trim().min(1).max(200).optional(),
  vaccinatedAt: dateString.optional(),
  nextScheduledDate: dateString.optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Examinations =====
export const createExaminationSchema = z.object({
  memberId: idField,
  examinationType: z.string({ required_error: '検査の種類は必須です' }).trim().min(1, '検査の種類は必須です').max(200),
  examinedAt: dateString,
  nextScheduledDate: dateString.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateExaminationSchema = z.object({
  examinationType: z.string().trim().min(1).max(200).optional(),
  examinedAt: dateString.optional(),
  nextScheduledDate: dateString.optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Insurances =====
export const createInsuranceSchema = z.object({
  memberId: idField,
  insuranceType: z.string({ required_error: '保険の種類は必須です' }).trim().min(1, '保険の種類は必須です').max(200),
  providerName: z.string().trim().max(200).optional(),
  policyNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateInsuranceSchema = z.object({
  insuranceType: z.string().trim().min(1).max(200).optional(),
  providerName: z.string().trim().max(200).optional().nullable(),
  policyNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Prescriptions =====
export const createPrescriptionSchema = z.object({
  memberId: idField,
  prescriptionName: z.string({ required_error: '処方箋名は必須です' }).trim().min(1, '処方箋名は必須です').max(200),
  prescribedBy: z.string().trim().max(100).optional(),
  prescribedAt: dateString,
  expiresAt: dateString.optional(),
  pharmacyName: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updatePrescriptionSchema = z.object({
  prescriptionName: z.string().trim().min(1).max(200).optional(),
  prescribedBy: z.string().trim().max(100).optional().nullable(),
  prescribedAt: dateString.optional(),
  expiresAt: dateString.optional().nullable(),
  pharmacyName: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Emergency Contacts =====
export const createEmergencyContactSchema = z.object({
  memberId: idField,
  contactName: z.string({ required_error: '連絡先名は必須です' }).trim().min(1, '連絡先名は必須です').max(100),
  phoneNumber: z.string({ required_error: '電話番号は必須です' }).trim().min(1, '電話番号は必須です').max(20),
  relationship: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateEmergencyContactSchema = z.object({
  contactName: z.string().trim().min(1).max(100).optional(),
  phoneNumber: z.string().trim().min(1).max(20).optional(),
  relationship: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Body Measurements =====
export const createBodyMeasurementSchema = z.object({
  memberId: idField,
  weight: z.number().min(0.1, '体重は0.1以上を指定してください').max(9999).optional(),
  height: z.number().min(0.1, '身長は0.1以上を指定してください').max(9999).optional(),
  recordedAt: dateString,
  notes: z.string().trim().max(500).optional(),
}).refine((data) => data.weight != null || data.height != null, {
  message: '体重または身長のいずれかは必須です',
});

export const updateBodyMeasurementSchema = z.object({
  weight: z.number().min(0.1).max(9999).optional().nullable(),
  height: z.number().min(0.1).max(9999).optional().nullable(),
  recordedAt: dateString.optional(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== Allergies =====
export const createAllergySchema = z.object({
  memberId: idField,
  allergenName: z.string({ required_error: 'アレルゲン名は必須です' }).trim().min(1, 'アレルゲン名は必須です').max(200),
  allergyType: z.enum(['food', 'medication', 'environmental', 'pollen', 'atopy', 'other'], { required_error: 'アレルギーの種類は必須です' }),
  severity: z.enum(['mild', 'moderate', 'severe'], { required_error: '重症度は必須です' }),
  symptoms: z.string().trim().max(500).optional(),
  diagnosedAt: dateString.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateAllergySchema = z.object({
  allergenName: z.string().trim().min(1).max(200).optional(),
  allergyType: z.enum(['food', 'medication', 'environmental', 'pollen', 'atopy', 'other']).optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  symptoms: z.string().trim().max(500).optional().nullable(),
  diagnosedAt: dateString.optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: '更新するフィールドがありません',
});

// ===== NotificationSettings =====
export const updateNotificationSettingSchema = z.object({
  medicationReminderEnabled: z.boolean().optional(),
  missedMedicationEnabled: z.boolean().optional(),
  appointmentReminderEnabled: z.boolean().optional(),
  lowStockAlertEnabled: z.boolean().optional(),
  defaultReminderMinutesBefore: z.number().int().min(0, 'リマインダー時間は0以上で指定してください').max(120).optional(),
  defaultAppointmentReminderDaysBefore: z.number().int().min(0, 'リマインダー日数は0以上で指定してください').max(30).optional(),
  emailNotificationEnabled: z.boolean().optional(),
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
    .regex(/[0-9]/, 'パスワードには数字を含めてください')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/, 'パスワードには記号を含めてください'),
  displayName: z.string().trim().min(1, '表示名は必須です').max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, 'メールアドレスが長すぎます').email('有効なメールアドレスを入力してください'),
});
