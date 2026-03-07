import { describe, it, expect } from 'vitest';
import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity.getCharacterLoyaltyScore エッジケース', () => {
  it('負の使用日数は0', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(-5, 30)).toBe(0);
  });

  it('負の総日数は0', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(10, -30)).toBe(0);
  });

  it('両方負は0', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(-1, -1)).toBe(0);
  });

  it('大量の使用日数でも100以下', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(1000, 30)).toBeLessThanOrEqual(100);
  });

  it('365日中365日使用は100', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(365, 365)).toBe(100);
  });

  it('小数の使用日数', () => {
    const result = CharacterEntity.getCharacterLoyaltyScore(2.5, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = CharacterEntity.getCharacterLoyaltyScore(7, 30);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('1/3は33', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(1, 3)).toBe(33);
  });

  it('2/3は67', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(2, 3)).toBe(67);
  });

  it('非常に大きな数値', () => {
    const result = CharacterEntity.getCharacterLoyaltyScore(50000, 100000);
    expect(result).toBe(50);
  });

  it('総日数0で使用日数正は0', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(5, 0)).toBe(0);
  });

  it('90%は90', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(9, 10)).toBe(90);
  });
});

describe('CharacterEntity.getCharacterLoyaltyScoreLabel エッジケース', () => {
  it('境界値80は忠実', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(80)).toBe('忠実');
  });

  it('境界値40は普通', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(40)).toBe('普通');
  });

  it('境界値79は普通', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(79)).toBe('普通');
  });

  it('境界値39は浮気性', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(39)).toBe('浮気性');
  });

  it('0は浮気性', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(0)).toBe('浮気性');
  });

  it('100は忠実', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(100)).toBe('忠実');
  });
});
