import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity - Validation Edge Cases', () => {
  describe('isValidCharacterType 境界値', () => {
    it('大文字DOGは無効', () => {
      expect(CharacterEntity.isValidCharacterType('DOG')).toBe(false);
    });

    it('数字は無効', () => {
      expect(CharacterEntity.isValidCharacterType('123')).toBe(false);
    });

    it('スペース付きは無効', () => {
      expect(CharacterEntity.isValidCharacterType(' dog ')).toBe(false);
    });

    it('nullっぽい文字列は無効', () => {
      expect(CharacterEntity.isValidCharacterType('null')).toBe(false);
    });
  });

  describe('getCharacterConfig 境界値', () => {
    it('全4タイプのConfigが正しい名前を持つ', () => {
      expect(CharacterEntity.getCharacterConfig('dog').name).toBe('いぬ');
      expect(CharacterEntity.getCharacterConfig('cat').name).toBe('ねこ');
      expect(CharacterEntity.getCharacterConfig('rabbit').name).toBe('うさぎ');
      expect(CharacterEntity.getCharacterConfig('bird').name).toBe('インコ');
    });

    it('空文字はデフォルト(dog)を返す', () => {
      expect(CharacterEntity.getCharacterConfig('').name).toBe('いぬ');
    });

    it('Configにmessagesが含まれる', () => {
      const config = CharacterEntity.getCharacterConfig('cat');
      expect(config.messages).toBeDefined();
      expect(config.messages.medicationReminder).toBeTruthy();
    });
  });

  describe('getAllCharacterTypes 境界値', () => {
    it('返り値は元配列と独立したコピー', () => {
      const types1 = CharacterEntity.getAllCharacterTypes();
      const types2 = CharacterEntity.getAllCharacterTypes();
      expect(types1).not.toBe(types2);
      expect(types1).toEqual(types2);
    });
  });
});
