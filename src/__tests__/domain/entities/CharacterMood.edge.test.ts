import { CharacterEntity } from '@/domain/entities/Character';

describe('CharacterEntity - Mood Edge Cases', () => {
  describe('getMoodByAdherence', () => {
    it('境界値90でhappyを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(90)).toBe('happy');
    });

    it('境界値89でnormalを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(89)).toBe('normal');
    });

    it('境界値70でnormalを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(70)).toBe('normal');
    });

    it('境界値69でremindingを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(69)).toBe('reminding');
    });

    it('境界値50でremindingを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(50)).toBe('reminding');
    });

    it('境界値49でworriedを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(49)).toBe('worried');
    });

    it('境界値30でworriedを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(30)).toBe('worried');
    });

    it('境界値29でsadを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(29)).toBe('sad');
    });

    it('負の値でsadを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(-10)).toBe('sad');
    });
  });

  describe('getMoodMessage', () => {
    it('excitedで正しいメッセージを返す', () => {
      expect(CharacterEntity.getMoodMessage('excited')).toBe('素晴らしい成果です');
    });

    it('cheeringで正しいメッセージを返す', () => {
      expect(CharacterEntity.getMoodMessage('cheering')).toBe('応援しています');
    });

    it('worriedで正しいメッセージを返す', () => {
      expect(CharacterEntity.getMoodMessage('worried')).toBe('少し心配しています');
    });
  });
});
