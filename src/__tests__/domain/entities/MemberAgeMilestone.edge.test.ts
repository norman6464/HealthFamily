import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Age Milestone Edge Cases', () => {
  describe('getAgeMilestone', () => {
    it('マイルストーン直前の年齢(19歳)でnull', () => {
      expect(MemberEntity.getAgeMilestone(19)).toBeNull();
    });

    it('マイルストーン直後の年齢(21歳)でnull', () => {
      expect(MemberEntity.getAgeMilestone(21)).toBeNull();
    });

    it('64歳でnull', () => {
      expect(MemberEntity.getAgeMilestone(64)).toBeNull();
    });

    it('66歳でnull', () => {
      expect(MemberEntity.getAgeMilestone(66)).toBeNull();
    });

    it('100歳でnull', () => {
      expect(MemberEntity.getAgeMilestone(100)).toBeNull();
    });
  });

  describe('isUpcomingBirthday', () => {
    it('withinDays=0で当日のみtrue', () => {
      const birth = new Date('1990-03-05');
      const today = new Date('2026-03-05');
      expect(MemberEntity.isUpcomingBirthday(birth, today, 0)).toBe(true);
    });

    it('withinDays=0で翌日はfalse', () => {
      const birth = new Date('1990-03-06');
      const today = new Date('2026-03-05');
      expect(MemberEntity.isUpcomingBirthday(birth, today, 0)).toBe(false);
    });

    it('年末で翌年1月の誕生日は範囲外', () => {
      const birth = new Date('1990-01-05');
      const today = new Date('2026-12-30');
      expect(MemberEntity.isUpcomingBirthday(birth, today, 7)).toBe(false);
    });
  });

  describe('getBirthdayCountdown', () => {
    it('1日前で「誕生日まであと1日」', () => {
      const birth = new Date('1990-03-06');
      const today = new Date('2026-03-05');
      expect(MemberEntity.getBirthdayCountdown(birth, today)).toBe('誕生日まであと1日');
    });

    it('誕生日翌日で翌年までカウント', () => {
      const birth = new Date('1990-03-04');
      const today = new Date('2026-03-05');
      const result = MemberEntity.getBirthdayCountdown(birth, today);
      expect(result).toBe('誕生日まであと364日');
    });
  });
});
