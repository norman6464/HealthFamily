import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, SymptomType } from '@/domain/entities/HealthLog';

const createLog = (symptoms: SymptomType[]): HealthLog => ({
  id: 'log-1',
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  conditionLevel: 3,
  symptoms,
  recordedAt: new Date('2026-03-05T08:00:00'),
});

describe('HealthLogEntity 症状同時出現パターン', () => {
  describe('getSymptomPairs', () => {
    it('空配列は空Mapを返す', () => {
      const result = HealthLogEntity.getSymptomPairs([]);
      expect(result.size).toBe(0);
    });

    it('症状が1つだけの記録ではペアが生成されない', () => {
      const logs = [createLog(['headache'])];
      const result = HealthLogEntity.getSymptomPairs(logs);
      expect(result.size).toBe(0);
    });

    it('2つの症状から1ペアが生成される', () => {
      const logs = [createLog(['headache', 'fever'])];
      const result = HealthLogEntity.getSymptomPairs(logs);
      expect(result.size).toBe(1);
      expect(result.get('fever+headache')).toBe(1);
    });

    it('3つの症状から3ペアが生成される', () => {
      const logs = [createLog(['headache', 'fever', 'fatigue'])];
      const result = HealthLogEntity.getSymptomPairs(logs);
      expect(result.size).toBe(3);
    });

    it('複数記録で同じペアのカウントが増える', () => {
      const logs = [
        createLog(['headache', 'fever']),
        createLog(['headache', 'fever']),
        createLog(['headache', 'fever']),
      ];
      const result = HealthLogEntity.getSymptomPairs(logs);
      expect(result.get('fever+headache')).toBe(3);
    });

    it('ペアキーはアルファベット順にソートされる', () => {
      const logs = [createLog(['nausea', 'headache'])];
      const result = HealthLogEntity.getSymptomPairs(logs);
      expect(result.has('headache+nausea')).toBe(true);
    });

    it('症状なしの記録は無視される', () => {
      const logs = [createLog([])];
      const result = HealthLogEntity.getSymptomPairs(logs);
      expect(result.size).toBe(0);
    });
  });

  describe('getCoOccurrenceRate', () => {
    it('同時出現率を正しく算出する', () => {
      const logs = [
        createLog(['headache', 'fever']),
        createLog(['headache']),
        createLog(['fever']),
        createLog(['headache', 'fever']),
      ];
      // headache出現: 3回, そのうちfeverと同時: 2回 => 67%
      expect(HealthLogEntity.getCoOccurrenceRate(logs, 'headache', 'fever')).toBe(67);
    });

    it('対象症状が存在しない場合は0を返す', () => {
      const logs = [createLog(['headache'])];
      expect(HealthLogEntity.getCoOccurrenceRate(logs, 'fever', 'nausea')).toBe(0);
    });

    it('全て同時出現なら100を返す', () => {
      const logs = [
        createLog(['headache', 'fever']),
        createLog(['headache', 'fever']),
      ];
      expect(HealthLogEntity.getCoOccurrenceRate(logs, 'headache', 'fever')).toBe(100);
    });

    it('空配列は0を返す', () => {
      expect(HealthLogEntity.getCoOccurrenceRate([], 'headache', 'fever')).toBe(0);
    });
  });

  describe('getMostCommonPair', () => {
    it('空配列はnullを返す', () => {
      expect(HealthLogEntity.getMostCommonPair([])).toBeNull();
    });

    it('症状ペアがない場合はnullを返す', () => {
      const logs = [createLog(['headache']), createLog(['fever'])];
      expect(HealthLogEntity.getMostCommonPair(logs)).toBeNull();
    });

    it('最も多いペアを返す', () => {
      const logs = [
        createLog(['headache', 'fever']),
        createLog(['headache', 'fever']),
        createLog(['headache', 'nausea']),
      ];
      const result = HealthLogEntity.getMostCommonPair(logs);
      expect(result).toEqual({ pair: 'fever+headache', count: 2 });
    });

    it('同数の場合はどちらかを返す', () => {
      const logs = [
        createLog(['headache', 'fever']),
        createLog(['headache', 'nausea']),
      ];
      const result = HealthLogEntity.getMostCommonPair(logs);
      expect(result).not.toBeNull();
      expect(result!.count).toBe(1);
    });
  });
});
