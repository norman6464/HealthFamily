import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Age Milestone', () => {
  describe('getAgeMilestone', () => {
    it('0歳で「誕生」を返す', () => {
      expect(MemberEntity.getAgeMilestone(0)).toBe('誕生');
    });

    it('1歳で「1歳」を返す', () => {
      expect(MemberEntity.getAgeMilestone(1)).toBe('1歳');
    });

    it('20歳で「成人」を返す', () => {
      expect(MemberEntity.getAgeMilestone(20)).toBe('成人');
    });

    it('65歳で「高齢者」を返す', () => {
      expect(MemberEntity.getAgeMilestone(65)).toBe('高齢者');
    });

    it('75歳で「後期高齢者」を返す', () => {
      expect(MemberEntity.getAgeMilestone(75)).toBe('後期高齢者');
    });

    it('マイルストーンに該当しない年齢でnullを返す', () => {
      expect(MemberEntity.getAgeMilestone(25)).toBeNull();
    });
  });

  describe('isUpcomingBirthday', () => {
    it('7日以内の誕生日でtrueを返す', () => {
      const birthDate = new Date('1990-03-10');
      const today = new Date('2026-03-05');
      expect(MemberEntity.isUpcomingBirthday(birthDate, today, 7)).toBe(true);
    });

    it('8日後の誕生日で7日以内ならfalseを返す', () => {
      const birthDate = new Date('1990-03-13');
      const today = new Date('2026-03-05');
      expect(MemberEntity.isUpcomingBirthday(birthDate, today, 7)).toBe(false);
    });

    it('当日の誕生日でtrueを返す', () => {
      const birthDate = new Date('1990-03-05');
      const today = new Date('2026-03-05');
      expect(MemberEntity.isUpcomingBirthday(birthDate, today, 7)).toBe(true);
    });
  });

  describe('getBirthdayCountdown', () => {
    it('当日で「今日が誕生日です」を返す', () => {
      const birthDate = new Date('1990-03-05');
      const today = new Date('2026-03-05');
      expect(MemberEntity.getBirthdayCountdown(birthDate, today)).toBe('今日が誕生日です');
    });

    it('3日後で「誕生日まであと3日」を返す', () => {
      const birthDate = new Date('1990-03-08');
      const today = new Date('2026-03-05');
      expect(MemberEntity.getBirthdayCountdown(birthDate, today)).toBe('誕生日まであと3日');
    });

    it('翌年の場合でも正しく計算する', () => {
      const birthDate = new Date('1990-01-10');
      const today = new Date('2026-12-25');
      const result = MemberEntity.getBirthdayCountdown(birthDate, today);
      expect(result).toBe('誕生日まであと16日');
    });
  });
});
