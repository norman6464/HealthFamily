import { CharacterEntity } from '@/domain/entities/Character';
import type { CharacterMood } from '@/domain/entities/Character';

describe('CharacterEntity - Mood', () => {
  describe('getMoodByAdherence', () => {
    it('遵守率90以上でhappyを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(95)).toBe('happy');
    });

    it('遵守率70-89でnormalを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(75)).toBe('normal');
    });

    it('遵守率50-69でremindingを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(55)).toBe('reminding');
    });

    it('遵守率30-49でworriedを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(35)).toBe('worried');
    });

    it('遵守率30未満でsadを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(20)).toBe('sad');
    });

    it('遵守率100でhappyを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(100)).toBe('happy');
    });

    it('遵守率0でsadを返す', () => {
      expect(CharacterEntity.getMoodByAdherence(0)).toBe('sad');
    });
  });

  describe('getMoodLabel', () => {
    it.each<[CharacterMood, string]>([
      ['happy', '喜び'],
      ['excited', '興奮'],
      ['normal', '通常'],
      ['reminding', 'お知らせ'],
      ['worried', '心配'],
      ['sad', '悲しみ'],
      ['cheering', '応援'],
    ])('%sのラベルを返す', (mood, expected) => {
      expect(CharacterEntity.getMoodLabel(mood)).toBe(expected);
    });
  });

  describe('getMoodMessage', () => {
    it('happyで励ましメッセージを返す', () => {
      const msg = CharacterEntity.getMoodMessage('happy');
      expect(msg).toBe('とても良い調子です');
    });

    it('sadで応援メッセージを返す', () => {
      const msg = CharacterEntity.getMoodMessage('sad');
      expect(msg).toBe('一緒に頑張りましょう');
    });

    it('normalで通常メッセージを返す', () => {
      const msg = CharacterEntity.getMoodMessage('normal');
      expect(msg).toBe('いつも通りです');
    });
  });
});
