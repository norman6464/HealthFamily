import { describe, it, expect } from 'vitest';
import { HealthLogEntity, ConditionLevel } from '@/domain/entities/HealthLog';

describe('HealthLogEntity getConditionIcon', () => {
  it('レベル1はFrownアイコン', () => {
    expect(HealthLogEntity.getConditionIcon(1)).toBe('Frown');
  });

  it('レベル2はMehアイコン', () => {
    expect(HealthLogEntity.getConditionIcon(2)).toBe('Meh');
  });

  it('レベル3はMinusCircleアイコン', () => {
    expect(HealthLogEntity.getConditionIcon(3)).toBe('MinusCircle');
  });

  it('レベル4はSmileアイコン', () => {
    expect(HealthLogEntity.getConditionIcon(4)).toBe('Smile');
  });

  it('レベル5はLaughアイコン', () => {
    expect(HealthLogEntity.getConditionIcon(5)).toBe('Laugh');
  });

  it('全レベルで文字列を返す', () => {
    const levels: ConditionLevel[] = [1, 2, 3, 4, 5];
    for (const level of levels) {
      const icon = HealthLogEntity.getConditionIcon(level);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    }
  });
});
