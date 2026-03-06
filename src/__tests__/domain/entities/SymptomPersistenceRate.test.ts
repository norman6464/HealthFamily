import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('getSymptomPersistenceRate', () => {
  it('空配列の場合0を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceRate([], 'headache')).toBe(0);
  });

  it('対象症状がない場合0を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceRate([['fever'], ['cough']], 'headache')).toBe(0);
  });

  it('全ての記録に含まれる場合100を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceRate([['headache'], ['headache'], ['headache']], 'headache')).toBe(100);
  });

  it('半分の記録に含まれる場合50を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceRate([['headache'], ['fever'], ['headache'], ['fever']], 'headache')).toBe(50);
  });

  it('1件中1件の場合100を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceRate([['headache', 'fever']], 'headache')).toBe(100);
  });

  it('複数症状を含む記録でも正しくカウントする', () => {
    const records = [['headache', 'fever'], ['fever'], ['headache', 'cough']];
    expect(HealthLogEntity.getSymptomPersistenceRate(records, 'headache')).toBe(67);
  });
});

describe('getSymptomPersistenceLabel', () => {
  it('70以上は持続的を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceLabel(70)).toBe('持続的');
  });

  it('40以上70未満は断続的を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceLabel(50)).toBe('断続的');
  });

  it('40未満は一時的を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceLabel(20)).toBe('一時的');
  });

  it('0は一時的を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceLabel(0)).toBe('一時的');
  });

  it('100は持続的を返す', () => {
    expect(HealthLogEntity.getSymptomPersistenceLabel(100)).toBe('持続的');
  });
});
