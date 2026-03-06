import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Health Score', () => {
  describe('calculateHealthScore', () => {
    it('全て満点で100を返す', () => {
      expect(
        MemberEntity.calculateHealthScore({
          adherenceRate: 100,
          averageCondition: 5,
          appointmentComplianceRate: 100,
        }),
      ).toBe(100);
    });

    it('全て0で0を返す', () => {
      expect(
        MemberEntity.calculateHealthScore({
          adherenceRate: 0,
          averageCondition: 1,
          appointmentComplianceRate: 0,
        }),
      ).toBe(0);
    });

    it('服薬遵守率の重みが50%', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 80,
        averageCondition: 1,
        appointmentComplianceRate: 0,
      });
      expect(score).toBe(40);
    });

    it('体調の重みが30%', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 0,
        averageCondition: 5,
        appointmentComplianceRate: 0,
      });
      expect(score).toBe(30);
    });

    it('通院遵守率の重みが20%', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 0,
        averageCondition: 1,
        appointmentComplianceRate: 100,
      });
      expect(score).toBe(20);
    });

    it('バランスの取れたスコア', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 70,
        averageCondition: 3,
        appointmentComplianceRate: 80,
      });
      expect(score).toBe(66);
    });
  });

  describe('getHealthScoreLabel', () => {
    it('90以上で「優良」を返す', () => {
      expect(MemberEntity.getHealthScoreLabel(95)).toBe('優良');
    });

    it('70以上90未満で「良好」を返す', () => {
      expect(MemberEntity.getHealthScoreLabel(75)).toBe('良好');
    });

    it('50以上70未満で「普通」を返す', () => {
      expect(MemberEntity.getHealthScoreLabel(55)).toBe('普通');
    });

    it('50未満で「要改善」を返す', () => {
      expect(MemberEntity.getHealthScoreLabel(30)).toBe('要改善');
    });
  });

  describe('getHealthScoreColor', () => {
    it('90以上で緑色', () => {
      expect(MemberEntity.getHealthScoreColor(95)).toBe('text-green-600');
    });

    it('70以上90未満で青色', () => {
      expect(MemberEntity.getHealthScoreColor(75)).toBe('text-blue-600');
    });

    it('50以上70未満でオレンジ色', () => {
      expect(MemberEntity.getHealthScoreColor(55)).toBe('text-orange-600');
    });

    it('50未満で赤色', () => {
      expect(MemberEntity.getHealthScoreColor(30)).toBe('text-red-600');
    });
  });
});
