import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity トレンドメッセージ・スタイル', () => {
  describe('getConditionTrendMessage', () => {
    it('上昇トレンドは改善メッセージを返す', () => {
      expect(HealthLogEntity.getConditionTrendMessage('up')).toBe('体調が改善傾向です');
    });

    it('下降トレンドは悪化メッセージを返す', () => {
      expect(HealthLogEntity.getConditionTrendMessage('down')).toBe('体調が下降傾向です');
    });

    it('安定トレンドは安定メッセージを返す', () => {
      expect(HealthLogEntity.getConditionTrendMessage('stable')).toBe('体調は安定しています');
    });
  });

  describe('getConditionTrendStyle', () => {
    it('上昇トレンドは緑系スタイルを返す', () => {
      const style = HealthLogEntity.getConditionTrendStyle('up');
      expect(style.text).toContain('green');
    });

    it('下降トレンドは赤系スタイルを返す', () => {
      const style = HealthLogEntity.getConditionTrendStyle('down');
      expect(style.text).toContain('red');
    });

    it('安定トレンドは灰色系スタイルを返す', () => {
      const style = HealthLogEntity.getConditionTrendStyle('stable');
      expect(style.text).toContain('gray');
    });
  });

  describe('getConditionLabel', () => {
    it('レベル1は「とても悪い」を返す', () => {
      expect(HealthLogEntity.getConditionLabel(1)).toBe('とても悪い');
    });

    it('レベル2は「悪い」を返す', () => {
      expect(HealthLogEntity.getConditionLabel(2)).toBe('悪い');
    });

    it('レベル3は「普通」を返す', () => {
      expect(HealthLogEntity.getConditionLabel(3)).toBe('普通');
    });

    it('レベル4は「良い」を返す', () => {
      expect(HealthLogEntity.getConditionLabel(4)).toBe('良い');
    });

    it('レベル5は「とても良い」を返す', () => {
      expect(HealthLogEntity.getConditionLabel(5)).toBe('とても良い');
    });
  });
});
