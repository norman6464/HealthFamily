import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'ap-northeast-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
});

const tables = [
  {
    TableName: 'HealthFamily-Users',
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' as const }],
  },
  {
    TableName: 'HealthFamily-Members',
    KeySchema: [{ AttributeName: 'memberId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'memberId', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'memberType', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'UserMembers-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' as const },
        { AttributeName: 'memberType', KeyType: 'RANGE' as const },
      ],
      Projection: { ProjectionType: 'ALL' as const },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }],
  },
  {
    TableName: 'HealthFamily-Medications',
    KeySchema: [{ AttributeName: 'medicationId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'medicationId', AttributeType: 'S' as const },
      { AttributeName: 'memberId', AttributeType: 'S' as const },
      { AttributeName: 'createdAt', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'category', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'MemberMedications-index',
        KeySchema: [
          { AttributeName: 'memberId', KeyType: 'HASH' as const },
          { AttributeName: 'createdAt', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'UserMedications-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' as const },
          { AttributeName: 'category', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  },
  {
    TableName: 'HealthFamily-Schedules',
    KeySchema: [{ AttributeName: 'scheduleId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'scheduleId', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'scheduledTime', AttributeType: 'S' as const },
      { AttributeName: 'medicationId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserSchedules-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' as const },
          { AttributeName: 'scheduledTime', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'MedicationSchedules-index',
        KeySchema: [
          { AttributeName: 'medicationId', KeyType: 'HASH' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  },
  {
    TableName: 'HealthFamily-MedicationRecords',
    KeySchema: [{ AttributeName: 'recordId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'recordId', AttributeType: 'S' as const },
      { AttributeName: 'memberId', AttributeType: 'S' as const },
      { AttributeName: 'takenAt', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'MemberRecords-index',
        KeySchema: [
          { AttributeName: 'memberId', KeyType: 'HASH' as const },
          { AttributeName: 'takenAt', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'UserDailyRecords-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' as const },
          { AttributeName: 'takenAt', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  },
  {
    TableName: 'HealthFamily-Hospitals',
    KeySchema: [{ AttributeName: 'hospitalId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'hospitalId', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'hospitalType', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'UserHospitals-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' as const },
        { AttributeName: 'hospitalType', KeyType: 'RANGE' as const },
      ],
      Projection: { ProjectionType: 'ALL' as const },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }],
  },
  {
    TableName: 'HealthFamily-Appointments',
    KeySchema: [{ AttributeName: 'appointmentId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'appointmentId', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'appointmentDate', AttributeType: 'S' as const },
      { AttributeName: 'memberId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserAppointments-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' as const },
          { AttributeName: 'appointmentDate', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'MemberAppointments-index',
        KeySchema: [
          { AttributeName: 'memberId', KeyType: 'HASH' as const },
          { AttributeName: 'appointmentDate', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  },
  {
    TableName: 'HealthFamily-MedicalHistory',
    KeySchema: [{ AttributeName: 'historyId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'historyId', AttributeType: 'S' as const },
      { AttributeName: 'memberId', AttributeType: 'S' as const },
      { AttributeName: 'historyType', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'MemberHistory-index',
        KeySchema: [
          { AttributeName: 'memberId', KeyType: 'HASH' as const },
          { AttributeName: 'historyType', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'UserHistory-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' as const },
          { AttributeName: 'historyType', KeyType: 'RANGE' as const },
        ],
        Projection: { ProjectionType: 'ALL' as const },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  },
  {
    TableName: 'HealthFamily-NutritionRecords',
    KeySchema: [{ AttributeName: 'nutritionId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'nutritionId', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'recordDate', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'UserNutrition-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' as const },
        { AttributeName: 'recordDate', KeyType: 'RANGE' as const },
      ],
      Projection: { ProjectionType: 'ALL' as const },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }],
  },
  {
    TableName: 'HealthFamily-ExerciseRecords',
    KeySchema: [{ AttributeName: 'exerciseId', KeyType: 'HASH' as const }],
    AttributeDefinitions: [
      { AttributeName: 'exerciseId', AttributeType: 'S' as const },
      { AttributeName: 'userId', AttributeType: 'S' as const },
      { AttributeName: 'recordDate', AttributeType: 'S' as const },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'UserExercises-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' as const },
        { AttributeName: 'recordDate', KeyType: 'RANGE' as const },
      ],
      Projection: { ProjectionType: 'ALL' as const },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }],
  },
];

async function createTables() {
  for (const table of tables) {
    try {
      await client.send(new CreateTableCommand({
        ...table,
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      }));
      console.log(`テーブル作成完了: ${table.TableName}`);
    } catch (e: unknown) {
      const error = e as { name?: string };
      if (error.name === 'ResourceInUseException') {
        console.log(`テーブル既存: ${table.TableName}`);
      } else {
        console.error(`テーブル作成失敗: ${table.TableName}`, e);
      }
    }
  }
}

createTables();
