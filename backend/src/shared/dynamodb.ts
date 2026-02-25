import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const client = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMODB_ENDPOINT || undefined,
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLE_NAMES = {
  USERS: env.USERS_TABLE,
  MEMBERS: env.MEMBERS_TABLE,
  MEDICATIONS: env.MEDICATIONS_TABLE,
  SCHEDULES: env.SCHEDULES_TABLE,
  MEDICATION_RECORDS: env.MEDICATION_RECORDS_TABLE,
  HOSPITALS: env.HOSPITALS_TABLE,
  APPOINTMENTS: env.APPOINTMENTS_TABLE,
  MEDICAL_HISTORY: env.MEDICAL_HISTORY_TABLE,
  NUTRITION_RECORDS: env.NUTRITION_RECORDS_TABLE,
  EXERCISE_RECORDS: env.EXERCISE_RECORDS_TABLE,
} as const;
