import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity - Visit Pattern Edge Cases', () => {
  describe('getVisitFrequencyLabel', () => {
    it('境界値1日で「週1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(1)).toBe('週1回程度');
    });

    it('境界値8日で「2週に1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(8)).toBe('2週に1回程度');
    });

    it('境界値15日で「月1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(15)).toBe('月1回程度');
    });

    it('境界値180日で「6ヶ月に1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(180)).toBe('6ヶ月に1回程度');
    });

    it('境界値181日で「年1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(181)).toBe('年1回程度');
    });

    it('負の値で「毎日」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(-1)).toBe('毎日');
    });
  });

  describe('groupByType', () => {
    it('hospitalTypeがundefinedの場合unknownグループに入る', () => {
      const hospitals = [{ name: 'A' }, { name: 'B', hospitalType: 'clinic' }];
      const result = HospitalEntity.groupByType(hospitals);
      expect(result['unknown']).toHaveLength(1);
      expect(result['clinic']).toHaveLength(1);
    });
  });

  describe('getTypeDistribution', () => {
    it('未定義タイプがそのままラベルに使われる', () => {
      const hospitals = [{ name: 'A', hospitalType: 'custom_type' }];
      const result = HospitalEntity.getTypeDistribution(hospitals);
      expect(result[0].label).toBe('custom_type');
      expect(result[0].percentage).toBe(100);
    });
  });
});
