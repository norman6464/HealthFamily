import { describe, it, expect } from 'vitest';
import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity 境界値テスト', () => {
  describe('getTimeGreeting', () => {
    it('4時はこんばんは(夜)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(4)).toBe('こんばんは');
    });

    it('5時はおはよう(朝の境界)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(5)).toBe('おはよう');
    });

    it('11時はおはよう(朝の終わり)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(11)).toBe('おはよう');
    });

    it('12時はこんにちは(昼の境界)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(12)).toBe('こんにちは');
    });

    it('17時はこんにちは(昼の終わり)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(17)).toBe('こんにちは');
    });

    it('18時はこんばんは(夜の境界)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(18)).toBe('こんばんは');
    });

    it('0時はこんばんは(深夜)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(0)).toBe('こんばんは');
    });

    it('23時はこんばんは(深夜前)', () => {
      expect(GreetingMessageEntity.getTimeGreeting(23)).toBe('こんばんは');
    });
  });

  describe('getWeeklySummaryMessage', () => {
    it('89%は順調メッセージ', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(89)).toBe('順調にお薬を服用できています');
    });

    it('90%は素晴らしいメッセージ(境界)', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(90)).toBe('素晴らしい1週間です。この調子で続けましょう');
    });

    it('100%は素晴らしいメッセージ', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(100)).toBe('素晴らしい1週間です。この調子で続けましょう');
    });

    it('70%は順調メッセージ(境界)', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(70)).toBe('順調にお薬を服用できています');
    });

    it('69%は少しずつメッセージ', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(69)).toBe('少しずつ習慣にしていきましょう');
    });

    it('50%は少しずつメッセージ(境界)', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(50)).toBe('少しずつ習慣にしていきましょう');
    });

    it('49%は頑張りましょうメッセージ', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(49)).toBe('一緒に頑張りましょう。無理せず続けることが大切です');
    });

    it('0%は頑張りましょうメッセージ', () => {
      expect(GreetingMessageEntity.getWeeklySummaryMessage(0)).toBe('一緒に頑張りましょう。無理せず続けることが大切です');
    });
  });

  describe('getDayOfWeekMessage', () => {
    it('全曜日でメッセージを返す', () => {
      for (let i = 0; i <= 6; i++) {
        const message = GreetingMessageEntity.getDayOfWeekMessage(i);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
    });

    it('火水木は同じデフォルトメッセージ', () => {
      expect(GreetingMessageEntity.getDayOfWeekMessage(2)).toBe('今日も頑張りましょう');
      expect(GreetingMessageEntity.getDayOfWeekMessage(3)).toBe('今日も頑張りましょう');
      expect(GreetingMessageEntity.getDayOfWeekMessage(4)).toBe('今日も頑張りましょう');
    });
  });
});
