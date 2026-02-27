import { z } from 'zod';

const envSchema = z.object({
  // サーバー設定
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

  // AWS設定
  AWS_REGION: z.string().default('ap-northeast-1'),
  DYNAMODB_ENDPOINT: z.string().optional(),

  // Cognito設定
  USER_POOL_ID: z.string().default(''),
  USER_POOL_CLIENT_ID: z.string().default(''),

  // テーブル名（デフォルト値あり）
  USERS_TABLE: z.string().default('HealthFamily-Users'),
  MEMBERS_TABLE: z.string().default('HealthFamily-Members'),
  MEDICATIONS_TABLE: z.string().default('HealthFamily-Medications'),
  SCHEDULES_TABLE: z.string().default('HealthFamily-Schedules'),
  MEDICATION_RECORDS_TABLE: z.string().default('HealthFamily-MedicationRecords'),
  HOSPITALS_TABLE: z.string().default('HealthFamily-Hospitals'),
  APPOINTMENTS_TABLE: z.string().default('HealthFamily-Appointments'),
  MEDICAL_HISTORY_TABLE: z.string().default('HealthFamily-MedicalHistory'),
  NUTRITION_RECORDS_TABLE: z.string().default('HealthFamily-NutritionRecords'),
  EXERCISE_RECORDS_TABLE: z.string().default('HealthFamily-ExerciseRecords'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('環境変数のバリデーションに失敗しました:');
    for (const error of result.error.errors) {
      console.error(`  ${error.path.join('.')}: ${error.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
