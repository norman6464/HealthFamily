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
  USERS: 'HealthFamily-Users',
  MEMBERS: 'HealthFamily-Members',
  MEDICATIONS: 'HealthFamily-Medications',
  SCHEDULES: 'HealthFamily-Schedules',
  MEDICATION_RECORDS: 'HealthFamily-MedicationRecords',
  HOSPITALS: 'HealthFamily-Hospitals',
  APPOINTMENTS: 'HealthFamily-Appointments',
  MEDICAL_HISTORY: 'HealthFamily-MedicalHistory',
  NUTRITION_RECORDS: 'HealthFamily-NutritionRecords',
  EXERCISE_RECORDS: 'HealthFamily-ExerciseRecords',
} as const;
