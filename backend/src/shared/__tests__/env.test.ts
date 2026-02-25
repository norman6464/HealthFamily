import { describe, it, expect } from 'vitest';
import { env } from '../env';

describe('env', () => {
  it('デフォルト値が設定される', () => {
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('test');
    expect(env.AWS_REGION).toBe('ap-northeast-1');
  });

  it('テーブル名のデフォルト値が設定される', () => {
    expect(env.MEMBERS_TABLE).toBe('HealthFamily-Members');
    expect(env.MEDICATIONS_TABLE).toBe('HealthFamily-Medications');
    expect(env.SCHEDULES_TABLE).toBe('HealthFamily-Schedules');
    expect(env.MEDICATION_RECORDS_TABLE).toBe('HealthFamily-MedicationRecords');
    expect(env.HOSPITALS_TABLE).toBe('HealthFamily-Hospitals');
    expect(env.APPOINTMENTS_TABLE).toBe('HealthFamily-Appointments');
  });

  it('ALLOWED_ORIGINSのデフォルト値が設定される', () => {
    expect(env.ALLOWED_ORIGINS).toContain('localhost');
  });
});
