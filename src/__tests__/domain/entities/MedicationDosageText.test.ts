import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity 用法用量テキスト生成', () => {
  describe('getFrequencyLabel', () => {
    it('"daily"は"毎日"を返す', () => {
      expect(MedicationEntity.getFrequencyLabel('daily')).toBe('毎日');
    });

    it('"twice_daily"は"1日2回"を返す', () => {
      expect(MedicationEntity.getFrequencyLabel('twice_daily')).toBe('1日2回');
    });

    it('"three_times_daily"は"1日3回"を返す', () => {
      expect(MedicationEntity.getFrequencyLabel('three_times_daily')).toBe('1日3回');
    });

    it('"weekly"は"週1回"を返す', () => {
      expect(MedicationEntity.getFrequencyLabel('weekly')).toBe('週1回');
    });

    it('"as_needed"は"必要時"を返す', () => {
      expect(MedicationEntity.getFrequencyLabel('as_needed')).toBe('必要時');
    });

    it('未知の頻度はそのまま返す', () => {
      expect(MedicationEntity.getFrequencyLabel('custom_freq')).toBe('custom_freq');
    });
  });

  describe('isExpiringSoon', () => {
    it('在庫5以下はtrueを返す', () => {
      expect(MedicationEntity.isExpiringSoon(5)).toBe(true);
    });

    it('在庫0はtrueを返す', () => {
      expect(MedicationEntity.isExpiringSoon(0)).toBe(true);
    });

    it('在庫6はfalseを返す', () => {
      expect(MedicationEntity.isExpiringSoon(6)).toBe(false);
    });

    it('在庫nullはfalseを返す', () => {
      expect(MedicationEntity.isExpiringSoon(null)).toBe(false);
    });

    it('カスタム閾値で判定する', () => {
      expect(MedicationEntity.isExpiringSoon(10, 10)).toBe(true);
      expect(MedicationEntity.isExpiringSoon(11, 10)).toBe(false);
    });
  });

  describe('getRefillRecommendation', () => {
    it('在庫0は"今すぐ補充が必要です"を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(0)).toBe('今すぐ補充が必要です');
    });

    it('在庫3は"早めの補充をおすすめします"を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(3)).toBe('早めの補充をおすすめします');
    });

    it('在庫7は"そろそろ補充を検討してください"を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(7)).toBe('そろそろ補充を検討してください');
    });

    it('在庫15は"十分な在庫があります"を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(15)).toBe('十分な在庫があります');
    });

    it('在庫nullは"在庫数が未設定です"を返す', () => {
      expect(MedicationEntity.getRefillRecommendation(null)).toBe('在庫数が未設定です');
    });
  });
});
