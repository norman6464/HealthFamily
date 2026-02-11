import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLE_NAMES = {
  USERS: process.env.USERS_TABLE || 'HealthFamily-Users',
  MEMBERS: process.env.MEMBERS_TABLE || 'HealthFamily-Members',
  MEDICATIONS: process.env.MEDICATIONS_TABLE || 'HealthFamily-Medications',
  SCHEDULES: process.env.SCHEDULES_TABLE || 'HealthFamily-Schedules',
  MEDICATION_RECORDS: process.env.MEDICATION_RECORDS_TABLE || 'HealthFamily-MedicationRecords',
  HOSPITALS: process.env.HOSPITALS_TABLE || 'HealthFamily-Hospitals',
  APPOINTMENTS: process.env.APPOINTMENTS_TABLE || 'HealthFamily-Appointments',
  MEDICAL_HISTORY: process.env.MEDICAL_HISTORY_TABLE || 'HealthFamily-MedicalHistory',
  NUTRITION_RECORDS: process.env.NUTRITION_RECORDS_TABLE || 'HealthFamily-NutritionRecords',
  EXERCISE_RECORDS: process.env.EXERCISE_RECORDS_TABLE || 'HealthFamily-ExerciseRecords',
} as const;
