import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity 用法用量テキスト エッジケース', () => {
  describe('getFrequencyLabel エッジケース', () => {
    it('空文字はそのまま返す', () => {
      expect(MedicationEntity.getFrequencyLabel('')).toBe('');
    });

    it('大文字の頻度コードはマッチしない', () => {
      expect(MedicationEntity.getFrequencyLabel('DAILY')).toBe('DAILY');
    });

    it('スペース付きの頻度コードはマッチしない', () => {
      expect(MedicationEntity.getFrequencyLabel(' daily ')).toBe(' daily ');
    });

    it('全ての定義済みラベルが取得可能', () => {
      const expected: Record<string, string> = {
        daily: '毎日',
        twice_daily: '1日2回',
        three_times_daily: '1日3回',
        weekly: '週1回',
        as_needed: '必要時',
      };
      for (const [code, label] of Object.entries(expected)) {
        expect(MedicationEntity.getFrequencyLabel(code)).toBe(label);
      }
    });
  });

  describe('isExpiringSoon エッジケース', () => {
    it('負の在庫はtrueを返す', () => {
      expect(MedicationEntity.isExpiringSoon(-1)).toBe(true);
    });

    it('閾値0で在庫0はtrueを返す', () => {
      expect(MedicationEntity.isExpiringSoon(0, 0)).toBe(true);
    });

    it('閾値0で在庫1はfalseを返す', () => {
      expect(MedicationEntity.isExpiringSoon(1, 0)).toBe(false);
    });

    it('大きな在庫は閾値以下でなければfalse', () => {
      expect(MedicationEntity.isExpiringSoon(1000, 999)).toBe(false);
      expect(MedicationEntity.isExpiringSoon(999, 999)).toBe(true);
    });
  });

  describe('getRefillRecommendation エッジケース', () => {
    it('境界値5は早めの補充を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(5)).toBe('早めの補充をおすすめします');
    });

    it('境界値6はそろそろ補充を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(6)).toBe('そろそろ補充を検討してください');
    });

    it('境界値10はそろそろ補充を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(10)).toBe('そろそろ補充を検討してください');
    });

    it('境界値11は十分な在庫を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(11)).toBe('十分な在庫があります');
    });

    it('非常に大きな在庫は十分な在庫を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(99999)).toBe('十分な在庫があります');
    });
  });
});
