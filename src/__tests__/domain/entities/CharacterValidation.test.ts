import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity - Validation', () => {
  describe('isValidCharacterType', () => {
    it('dogは有効', () => {
      expect(CharacterEntity.isValidCharacterType('dog')).toBe(true);
    });

    it('catは有効', () => {
      expect(CharacterEntity.isValidCharacterType('cat')).toBe(true);
    });

    it('rabbitは有効', () => {
      expect(CharacterEntity.isValidCharacterType('rabbit')).toBe(true);
    });

    it('birdは有効', () => {
      expect(CharacterEntity.isValidCharacterType('bird')).toBe(true);
    });

    it('unknownは無効', () => {
      expect(CharacterEntity.isValidCharacterType('unknown')).toBe(false);
    });

    it('空文字は無効', () => {
      expect(CharacterEntity.isValidCharacterType('')).toBe(false);
    });
  });

  describe('getCharacterConfig', () => {
    it('dogのConfigを返す', () => {
      const config = CharacterEntity.getCharacterConfig('dog');
      expect(config.name).toBe('いぬ');
    });

    it('catのConfigを返す', () => {
      const config = CharacterEntity.getCharacterConfig('cat');
      expect(config.name).toBe('ねこ');
    });

    it('無効タイプはdogのConfigを返す', () => {
      const config = CharacterEntity.getCharacterConfig('invalid');
      expect(config.name).toBe('いぬ');
    });
  });

  describe('getAllCharacterTypes', () => {
    it('4つのタイプを返す', () => {
      const types = CharacterEntity.getAllCharacterTypes();
      expect(types).toHaveLength(4);
    });

    it('全タイプを含む', () => {
      const types = CharacterEntity.getAllCharacterTypes();
      expect(types).toContain('dog');
      expect(types).toContain('cat');
      expect(types).toContain('rabbit');
      expect(types).toContain('bird');
    });
  });
});
