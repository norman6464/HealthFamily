import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('SymptomPersistenceRate エッジケーステスト', () => {
  describe('getSymptomPersistenceRate', () => {
    it('空配列の場合0を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceRate([], 'headache')).toBe(0);
    });

    it('全て空の症状リストの場合0を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceRate([[], [], []], 'headache')).toBe(0);
    });

    it('1件中0件の場合0を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceRate([['fever']], 'headache')).toBe(0);
    });

    it('大量データでも正しく計算する', () => {
      const records = Array(100).fill(['headache']);
      expect(HealthLogEntity.getSymptomPersistenceRate(records, 'headache')).toBe(100);
    });

    it('1件のみ含む場合の割合を正しく計算する', () => {
      const records = [['headache'], ['fever'], ['fever'], ['fever'], ['fever']];
      expect(HealthLogEntity.getSymptomPersistenceRate(records, 'headache')).toBe(20);
    });

    it('3件中2件の場合67を返す', () => {
      const records = [['headache'], ['headache'], ['fever']];
      expect(HealthLogEntity.getSymptomPersistenceRate(records, 'headache')).toBe(67);
    });

    it('存在しない症状は0を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceRate([['fever']], 'unknown_symptom')).toBe(0);
    });

    it('同じ症状が複数回含まれる記録でも1回としてカウントする', () => {
      const records = [['headache', 'headache']];
      expect(HealthLogEntity.getSymptomPersistenceRate(records, 'headache')).toBe(100);
    });
  });

  describe('getSymptomPersistenceLabel', () => {
    it('境界値: 70は持続的を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceLabel(70)).toBe('持続的');
    });

    it('境界値: 69は断続的を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceLabel(69)).toBe('断続的');
    });

    it('境界値: 40は断続的を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceLabel(40)).toBe('断続的');
    });

    it('境界値: 39は一時的を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceLabel(39)).toBe('一時的');
    });

    it('100は持続的を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceLabel(100)).toBe('持続的');
    });

    it('0は一時的を返す', () => {
      expect(HealthLogEntity.getSymptomPersistenceLabel(0)).toBe('一時的');
    });
  });
});
