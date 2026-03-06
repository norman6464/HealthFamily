import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity - Seasonal & Streak Edge Cases', () => {
  describe('getSeasonalGreeting 境界値', () => {
    it('2月(冬の最後)は冬の挨拶', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(2)).toBe('寒い日が続きますがお体ご自愛ください');
    });

    it('6月(春→夏の境界)は夏の挨拶', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(6)).toBe('暑い日が続きますが体調にお気をつけて');
    });

    it('8月(夏の最後)は夏の挨拶', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(8)).toBe('暑い日が続きますが体調にお気をつけて');
    });

    it('9月(夏→秋の境界)は秋の挨拶', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(9)).toBe('過ごしやすい季節になりましたね');
    });

    it('11月(秋の最後)は秋の挨拶', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(11)).toBe('過ごしやすい季節になりましたね');
    });
  });

  describe('getStreakEncouragement 境界値', () => {
    it('1日は序盤メッセージ', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(1)).toBe('1日連続です。良い調子です');
    });

    it('6日は序盤メッセージ', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(6)).toBe('6日連続です。良い調子です');
    });

    it('8日は中盤メッセージ', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(8)).toBe('8日連続です。素晴らしい継続力です');
    });

    it('29日は中盤メッセージ', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(29)).toBe('29日連続です。素晴らしい継続力です');
    });

    it('365日は長期メッセージ', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(365)).toBe('365日連続達成です。立派な習慣です');
    });
  });

  describe('formatGreetingWithName 境界値', () => {
    it('長い名前でも正しくフォーマット', () => {
      const name = 'あ'.repeat(50);
      expect(GreetingMessageEntity.formatGreetingWithName('おはよう', name)).toBe(`${name}さん、おはよう`);
    });
  });
});
