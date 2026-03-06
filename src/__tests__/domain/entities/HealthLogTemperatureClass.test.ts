import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity 体温分類・スコア算出', () => {
  describe('classifyTemperature', () => {
    it('35.0度未満は低体温', () => {
      expect(HealthLogEntity.classifyTemperature(34.5)).toBe('hypothermia');
    });

    it('36.0度は平熱', () => {
      expect(HealthLogEntity.classifyTemperature(36.0)).toBe('normal');
    });

    it('37.4度は平熱', () => {
      expect(HealthLogEntity.classifyTemperature(37.4)).toBe('normal');
    });

    it('37.5度は微熱', () => {
      expect(HealthLogEntity.classifyTemperature(37.5)).toBe('low_fever');
    });

    it('38.0度は発熱', () => {
      expect(HealthLogEntity.classifyTemperature(38.0)).toBe('fever');
    });

    it('39.0度は高熱', () => {
      expect(HealthLogEntity.classifyTemperature(39.0)).toBe('high_fever');
    });

    it('nullはunknownを返す', () => {
      expect(HealthLogEntity.classifyTemperature(null)).toBe('unknown');
    });
  });

  describe('getTemperatureLabel', () => {
    it('hypothermiaは低体温を返す', () => {
      expect(HealthLogEntity.getTemperatureLabel('hypothermia')).toBe('低体温');
    });

    it('normalは平熱を返す', () => {
      expect(HealthLogEntity.getTemperatureLabel('normal')).toBe('平熱');
    });

    it('low_feverは微熱を返す', () => {
      expect(HealthLogEntity.getTemperatureLabel('low_fever')).toBe('微熱');
    });

    it('feverは発熱を返す', () => {
      expect(HealthLogEntity.getTemperatureLabel('fever')).toBe('発熱');
    });

    it('high_feverは高熱を返す', () => {
      expect(HealthLogEntity.getTemperatureLabel('high_fever')).toBe('高熱');
    });

    it('unknownは不明を返す', () => {
      expect(HealthLogEntity.getTemperatureLabel('unknown')).toBe('不明');
    });
  });

  describe('calculateHealthScore', () => {
    it('体調レベル5で症状0なら100点', () => {
      expect(HealthLogEntity.calculateHealthScore(5, 0)).toBe(100);
    });

    it('体調レベル1で症状0なら20点', () => {
      expect(HealthLogEntity.calculateHealthScore(1, 0)).toBe(20);
    });

    it('体調レベル5で症状3なら70点', () => {
      // 5/5 * 100 = 100, 症状ペナルティ 3 * 10 = 30, 100 - 30 = 70
      expect(HealthLogEntity.calculateHealthScore(5, 3)).toBe(70);
    });

    it('体調レベル3で症状2なら40点', () => {
      // 3/5 * 100 = 60, 症状ペナルティ 2 * 10 = 20, 60 - 20 = 40
      expect(HealthLogEntity.calculateHealthScore(3, 2)).toBe(40);
    });

    it('スコアは0未満にならない', () => {
      expect(HealthLogEntity.calculateHealthScore(1, 10)).toBe(0);
    });
  });
});
