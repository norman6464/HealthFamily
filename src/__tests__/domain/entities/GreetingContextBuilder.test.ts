import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity - Greeting Context Builder', () => {
  describe('getTimeBasedGreeting', () => {
    it('早朝(5時)で「おはようございます」を返す', () => {
      expect(CharacterEntity.getTimeBasedGreeting(5)).toBe('おはようございます');
    });

    it('午前(10時)で「おはようございます」を返す', () => {
      expect(CharacterEntity.getTimeBasedGreeting(10)).toBe('おはようございます');
    });

    it('昼(12時)で「こんにちは」を返す', () => {
      expect(CharacterEntity.getTimeBasedGreeting(12)).toBe('こんにちは');
    });

    it('夕方(17時)で「こんにちは」を返す', () => {
      expect(CharacterEntity.getTimeBasedGreeting(17)).toBe('こんにちは');
    });

    it('夜(18時)で「こんばんは」を返す', () => {
      expect(CharacterEntity.getTimeBasedGreeting(18)).toBe('こんばんは');
    });

    it('深夜(2時)で「こんばんは」を返す', () => {
      expect(CharacterEntity.getTimeBasedGreeting(2)).toBe('こんばんは');
    });
  });

  describe('getGreetingContext', () => {
    it('スケジュールありで服薬情報を含む', () => {
      const context = CharacterEntity.getGreetingContext({
        pendingMedications: 3,
        upcomingAppointments: 1,
        memberName: '太郎',
      });
      expect(context).toContain('太郎');
      expect(context).toContain('3');
    });

    it('予定なしで予定なしメッセージを返す', () => {
      const context = CharacterEntity.getGreetingContext({
        pendingMedications: 0,
        upcomingAppointments: 0,
        memberName: '花子',
      });
      expect(context).toContain('予定はありません');
    });

    it('通院予定ありで通院情報を含む', () => {
      const context = CharacterEntity.getGreetingContext({
        pendingMedications: 0,
        upcomingAppointments: 2,
        memberName: '次郎',
      });
      expect(context).toContain('通院');
      expect(context).toContain('2');
    });
  });

  describe('buildGreetingMessage', () => {
    it('挨拶とコンテキストを組み合わせる', () => {
      const message = CharacterEntity.buildGreetingMessage(10, {
        pendingMedications: 1,
        upcomingAppointments: 0,
        memberName: '太郎',
      });
      expect(message).toContain('おはようございます');
      expect(message).toContain('太郎');
    });

    it('夜の挨拶とコンテキスト', () => {
      const message = CharacterEntity.buildGreetingMessage(20, {
        pendingMedications: 0,
        upcomingAppointments: 0,
        memberName: '花子',
      });
      expect(message).toContain('こんばんは');
      expect(message).toContain('花子');
    });

    it('服薬と通院の両方がある場合', () => {
      const message = CharacterEntity.buildGreetingMessage(14, {
        pendingMedications: 2,
        upcomingAppointments: 1,
        memberName: '三郎',
      });
      expect(message).toContain('こんにちは');
      expect(message).toContain('2');
      expect(message).toContain('通院');
    });
  });
});
