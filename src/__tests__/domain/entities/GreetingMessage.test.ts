import { describe, it, expect } from 'vitest';
import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity', () => {
  describe('getTimeGreeting', () => {
    it('朝(5-11時)は「おはよう」を返す', () => {
      expect(GreetingMessageEntity.getTimeGreeting(5)).toBe('おはよう');
      expect(GreetingMessageEntity.getTimeGreeting(11)).toBe('おはよう');
    });

    it('昼(12-17時)は「こんにちは」を返す', () => {
      expect(GreetingMessageEntity.getTimeGreeting(12)).toBe('こんにちは');
      expect(GreetingMessageEntity.getTimeGreeting(17)).toBe('こんにちは');
    });

    it('夜(18-4時)は「こんばんは」を返す', () => {
      expect(GreetingMessageEntity.getTimeGreeting(18)).toBe('こんばんは');
      expect(GreetingMessageEntity.getTimeGreeting(23)).toBe('こんばんは');
      expect(GreetingMessageEntity.getTimeGreeting(0)).toBe('こんばんは');
      expect(GreetingMessageEntity.getTimeGreeting(4)).toBe('こんばんは');
    });
  });

  describe('getWeeklySummaryMessage', () => {
    it('90%以上は称賛メッセージを返す', () => {
      const message = GreetingMessageEntity.getWeeklySummaryMessage(95);
      expect(message).toContain('素晴らしい');
    });

    it('70-89%は良好メッセージを返す', () => {
      const message = GreetingMessageEntity.getWeeklySummaryMessage(75);
      expect(message).toContain('順調');
    });

    it('50-69%は励ましメッセージを返す', () => {
      const message = GreetingMessageEntity.getWeeklySummaryMessage(55);
      expect(message).toContain('少しずつ');
    });

    it('50%未満は応援メッセージを返す', () => {
      const message = GreetingMessageEntity.getWeeklySummaryMessage(30);
      expect(message).toContain('一緒に');
    });

    it('0%でもメッセージを返す', () => {
      const message = GreetingMessageEntity.getWeeklySummaryMessage(0);
      expect(message.length).toBeGreaterThan(0);
    });

    it('nullの場合はデフォルトメッセージを返す', () => {
      const message = GreetingMessageEntity.getWeeklySummaryMessage(null);
      expect(message).toContain('今日も');
    });
  });

  describe('getDayOfWeekMessage', () => {
    it('月曜日は週始まりメッセージを返す', () => {
      expect(GreetingMessageEntity.getDayOfWeekMessage(1)).toContain('新しい週');
    });

    it('金曜日は週末メッセージを返す', () => {
      expect(GreetingMessageEntity.getDayOfWeekMessage(5)).toContain('あと少し');
    });

    it('日曜日はゆっくりメッセージを返す', () => {
      expect(GreetingMessageEntity.getDayOfWeekMessage(0)).toContain('ゆっくり');
    });

    it('その他の曜日は通常メッセージを返す', () => {
      const msg = GreetingMessageEntity.getDayOfWeekMessage(3);
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});
