import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity - Greeting Context Builder Edge Cases', () => {
  describe('getTimeBasedGreeting', () => {
    it('境界値4時で「こんばんは」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(4)).toBe('こんばんは');
    });

    it('境界値5時で「おはようございます」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(5)).toBe('おはようございます');
    });

    it('境界値11時で「おはようございます」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(11)).toBe('おはようございます');
    });

    it('境界値12時で「こんにちは」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(12)).toBe('こんにちは');
    });

    it('境界値17時で「こんにちは」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(17)).toBe('こんにちは');
    });

    it('境界値18時で「こんばんは」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(18)).toBe('こんばんは');
    });

    it('23時で「こんばんは」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(23)).toBe('こんばんは');
    });

    it('0時で「こんばんは」', () => {
      expect(CharacterEntity.getTimeBasedGreeting(0)).toBe('こんばんは');
    });
  });

  describe('getGreetingContext', () => {
    it('服薬と通院の両方がある場合', () => {
      const context = CharacterEntity.getGreetingContext({
        pendingMedications: 5,
        upcomingAppointments: 3,
        memberName: '太郎',
      });
      expect(context).toContain('5');
      expect(context).toContain('3');
      expect(context).toContain('通院');
    });

    it('大量の服薬予定', () => {
      const context = CharacterEntity.getGreetingContext({
        pendingMedications: 100,
        upcomingAppointments: 0,
        memberName: 'テスト',
      });
      expect(context).toContain('100');
    });
  });

  describe('buildGreetingMessage', () => {
    it('深夜0時のメッセージ', () => {
      const message = CharacterEntity.buildGreetingMessage(0, {
        pendingMedications: 0,
        upcomingAppointments: 0,
        memberName: 'ユーザー',
      });
      expect(message).toContain('こんばんは');
      expect(message).toContain('ユーザー');
      expect(message).toContain('予定はありません');
    });
  });
});
