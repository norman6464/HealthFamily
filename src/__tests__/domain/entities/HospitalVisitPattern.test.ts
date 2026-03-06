import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity - Visit Pattern', () => {
  describe('getVisitFrequencyLabel', () => {
    it('訪問間隔7日で「週1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(7)).toBe('週1回程度');
    });

    it('訪問間隔14日で「2週に1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(14)).toBe('2週に1回程度');
    });

    it('訪問間隔30日で「月1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(30)).toBe('月1回程度');
    });

    it('訪問間隔90日で「3ヶ月に1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(90)).toBe('3ヶ月に1回程度');
    });

    it('訪問間隔365日で「年1回程度」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(365)).toBe('年1回程度');
    });

    it('訪問間隔0日で「毎日」を返す', () => {
      expect(HospitalEntity.getVisitFrequencyLabel(0)).toBe('毎日');
    });
  });

  describe('groupByType', () => {
    const hospitals = [
      { name: 'A病院', hospitalType: 'general' },
      { name: 'Bクリニック', hospitalType: 'clinic' },
      { name: 'C病院', hospitalType: 'general' },
      { name: 'D歯科', hospitalType: 'dental' },
    ];

    it('タイプ別にグループ化する', () => {
      const result = HospitalEntity.groupByType(hospitals);
      expect(result['general']).toHaveLength(2);
      expect(result['clinic']).toHaveLength(1);
      expect(result['dental']).toHaveLength(1);
    });

    it('空配列で空オブジェクトを返す', () => {
      expect(HospitalEntity.groupByType([])).toEqual({});
    });
  });

  describe('getTypeDistribution', () => {
    const hospitals = [
      { name: 'A', hospitalType: 'general' },
      { name: 'B', hospitalType: 'general' },
      { name: 'C', hospitalType: 'clinic' },
      { name: 'D', hospitalType: 'dental' },
    ];

    it('タイプ別の件数と割合を返す', () => {
      const result = HospitalEntity.getTypeDistribution(hospitals);
      expect(result).toContainEqual({ type: 'general', label: '総合病院', count: 2, percentage: 50 });
      expect(result).toContainEqual({ type: 'clinic', label: 'クリニック', count: 1, percentage: 25 });
      expect(result).toContainEqual({ type: 'dental', label: '歯科', count: 1, percentage: 25 });
    });

    it('空配列で空配列を返す', () => {
      expect(HospitalEntity.getTypeDistribution([])).toEqual([]);
    });

    it('件数降順でソートされる', () => {
      const result = HospitalEntity.getTypeDistribution(hospitals);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });
  });
});
