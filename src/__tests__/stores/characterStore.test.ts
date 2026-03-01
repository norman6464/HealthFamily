import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '@/stores/characterStore';
import { CHARACTER_CONFIGS } from '@/domain/entities/Character';

describe('characterStore', () => {
  beforeEach(() => {
    useCharacterStore.setState({ selectedCharacter: 'cat' });
  });

  it('デフォルトのキャラクターはcatである', () => {
    const { selectedCharacter } = useCharacterStore.getState();
    expect(selectedCharacter).toBe('cat');
  });

  it('キャラクターを変更できる', () => {
    useCharacterStore.getState().setCharacter('dog');
    expect(useCharacterStore.getState().selectedCharacter).toBe('dog');
  });

  it('選択中のキャラクター設定を取得できる', () => {
    useCharacterStore.getState().setCharacter('rabbit');
    const config = useCharacterStore.getState().getConfig();
    expect(config).toBe(CHARACTER_CONFIGS['rabbit']);
  });

  it('キャラクターメッセージを取得できる', () => {
    const message = useCharacterStore.getState().getMessage('medicationReminder');
    expect(message).toBe(CHARACTER_CONFIGS['cat'].messages.medicationReminder);
  });

  it('キャラクター変更後にメッセージが変わる', () => {
    const catMessage = useCharacterStore.getState().getMessage('medicationComplete');
    useCharacterStore.getState().setCharacter('bird');
    const birdMessage = useCharacterStore.getState().getMessage('medicationComplete');
    expect(catMessage).toBe(CHARACTER_CONFIGS['cat'].messages.medicationComplete);
    expect(birdMessage).toBe(CHARACTER_CONFIGS['bird'].messages.medicationComplete);
  });
});
