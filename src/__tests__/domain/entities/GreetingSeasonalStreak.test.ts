import { GreetingMessageEntity } from '@/domain/entities/GreetingMessage';

describe('GreetingMessageEntity - Seasonal & Streak', () => {
  describe('getSeasonalGreeting', () => {
    it('3月は春の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(3)).toBe('春の陽気が気持ちいい季節ですね');
    });

    it('4月は春の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(4)).toBe('春の陽気が気持ちいい季節ですね');
    });

    it('5月は春の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(5)).toBe('春の陽気が気持ちいい季節ですね');
    });

    it('7月は夏の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(7)).toBe('暑い日が続きますが体調にお気をつけて');
    });

    it('10月は秋の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(10)).toBe('過ごしやすい季節になりましたね');
    });

    it('1月は冬の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(1)).toBe('寒い日が続きますがお体ご自愛ください');
    });

    it('12月は冬の挨拶を返す', () => {
      expect(GreetingMessageEntity.getSeasonalGreeting(12)).toBe('寒い日が続きますがお体ご自愛ください');
    });
  });

  describe('getStreakEncouragement', () => {
    it('0日は開始メッセージを返す', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(0)).toBe('今日から記録を始めましょう');
    });

    it('3日は序盤メッセージを返す', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(3)).toBe('3日連続です。良い調子です');
    });

    it('7日は週間メッセージを返す', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(7)).toBe('1週間達成です。習慣になってきましたね');
    });

    it('14日は2週間メッセージを返す', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(14)).toBe('14日連続です。素晴らしい継続力です');
    });

    it('30日は1ヶ月メッセージを返す', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(30)).toBe('30日連続達成です。立派な習慣です');
    });

    it('100日は大台メッセージを返す', () => {
      expect(GreetingMessageEntity.getStreakEncouragement(100)).toBe('100日連続達成です。立派な習慣です');
    });
  });

  describe('formatGreetingWithName', () => {
    it('名前付きの挨拶を返す', () => {
      expect(GreetingMessageEntity.formatGreetingWithName('おはよう', '太郎')).toBe('太郎さん、おはよう');
    });

    it('名前なしの場合はそのまま返す', () => {
      expect(GreetingMessageEntity.formatGreetingWithName('こんにちは', null)).toBe('こんにちは');
    });

    it('空文字名の場合はそのまま返す', () => {
      expect(GreetingMessageEntity.formatGreetingWithName('こんばんは', '')).toBe('こんばんは');
    });
  });
});
