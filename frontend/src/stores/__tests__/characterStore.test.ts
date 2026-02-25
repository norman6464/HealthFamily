import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';

describe('characterStore', () => {
  beforeEach(() => {
    useCharacterStore.setState({ selectedCharacter: 'cat' });
  });

  it('初期キャラクターはcatである', () => {
    const state = useCharacterStore.getState();
    expect(state.selectedCharacter).toBe('cat');
  });

  it('キャラクターを変更できる', () => {
    useCharacterStore.getState().setCharacter('dog');
    expect(useCharacterStore.getState().selectedCharacter).toBe('dog');
  });

  it('キャラクター設定を取得できる', () => {
    const config = useCharacterStore.getState().getConfig();
    expect(config.type).toBe('cat');
    expect(config.icon).toBe('🐈️');
    expect(config.name).toBe('ねこ');
  });

  it('服薬リマインダーメッセージを取得できる', () => {
    const message = useCharacterStore.getState().getMessage('medicationReminder');
    expect(message).toBe('にゃいにゃい！お薬の時間にゃ！');
  });

  it('犬に切り替えるとメッセージが変わる', () => {
    useCharacterStore.getState().setCharacter('dog');
    const message = useCharacterStore.getState().getMessage('medicationReminder');
    expect(message).toBe('わんわん！お薬の時間だよ！');
  });
});
