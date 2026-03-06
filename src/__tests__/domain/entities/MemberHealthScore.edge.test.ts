import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity - Health Score Edge Cases', () => {
  describe('calculateHealthScore', () => {
    it('全て中間値でバランスの取れたスコア', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 50,
        averageCondition: 3,
        appointmentComplianceRate: 50,
      });
      expect(score).toBe(50);
    });

    it('体調が最低(1)で他が満点', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 100,
        averageCondition: 1,
        appointmentComplianceRate: 100,
      });
      expect(score).toBe(70);
    });

    it('体調が2の場合', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 0,
        averageCondition: 2,
        appointmentComplianceRate: 0,
      });
      expect(score).toBe(8);
    });

    it('体調が4の場合', () => {
      const score = MemberEntity.calculateHealthScore({
        adherenceRate: 0,
        averageCondition: 4,
        appointmentComplianceRate: 0,
      });
      expect(score).toBe(23);
    });
  });

  describe('getHealthScoreLabel', () => {
    it('境界値90で「優良」', () => {
      expect(MemberEntity.getHealthScoreLabel(90)).toBe('優良');
    });

    it('境界値89で「良好」', () => {
      expect(MemberEntity.getHealthScoreLabel(89)).toBe('良好');
    });

    it('境界値70で「良好」', () => {
      expect(MemberEntity.getHealthScoreLabel(70)).toBe('良好');
    });

    it('境界値69で「普通」', () => {
      expect(MemberEntity.getHealthScoreLabel(69)).toBe('普通');
    });

    it('境界値50で「普通」', () => {
      expect(MemberEntity.getHealthScoreLabel(50)).toBe('普通');
    });

    it('境界値49で「要改善」', () => {
      expect(MemberEntity.getHealthScoreLabel(49)).toBe('要改善');
    });

    it('0で「要改善」', () => {
      expect(MemberEntity.getHealthScoreLabel(0)).toBe('要改善');
    });

    it('100で「優良」', () => {
      expect(MemberEntity.getHealthScoreLabel(100)).toBe('優良');
    });
  });

  describe('getHealthScoreColor', () => {
    it('境界値90で緑色', () => {
      expect(MemberEntity.getHealthScoreColor(90)).toBe('text-green-600');
    });

    it('境界値89で青色', () => {
      expect(MemberEntity.getHealthScoreColor(89)).toBe('text-blue-600');
    });

    it('境界値70で青色', () => {
      expect(MemberEntity.getHealthScoreColor(70)).toBe('text-blue-600');
    });

    it('境界値50でオレンジ色', () => {
      expect(MemberEntity.getHealthScoreColor(50)).toBe('text-orange-600');
    });

    it('境界値49で赤色', () => {
      expect(MemberEntity.getHealthScoreColor(49)).toBe('text-red-600');
    });
  });
});
