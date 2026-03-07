import { describe, it, expect } from 'vitest';
import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity.getCharacterLoyaltyScore', () => {
  it('使用日数0は0', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(0, 30)).toBe(0);
  });

  it('全日使用は100', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(30, 30)).toBe(100);
  });

  it('総日数0は0', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(0, 0)).toBe(0);
  });

  it('半分は50', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(15, 30)).toBe(50);
  });

  it('使用日数が多いほどスコアが高い', () => {
    const low = CharacterEntity.getCharacterLoyaltyScore(5, 30);
    const high = CharacterEntity.getCharacterLoyaltyScore(25, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = CharacterEntity.getCharacterLoyaltyScore(10, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(50, 30)).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = CharacterEntity.getCharacterLoyaltyScore(7, 30);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('1日中1日使用は100', () => {
    expect(CharacterEntity.getCharacterLoyaltyScore(1, 1)).toBe(100);
  });
});

describe('CharacterEntity.getCharacterLoyaltyScoreLabel', () => {
  it('高スコアは忠実', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(85)).toBe('忠実');
  });

  it('中スコアは普通', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(55)).toBe('普通');
  });

  it('低スコアは浮気性', () => {
    expect(CharacterEntity.getCharacterLoyaltyScoreLabel(25)).toBe('浮気性');
  });
});
