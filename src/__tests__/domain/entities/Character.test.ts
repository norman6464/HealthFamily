import { describe, it, expect } from 'vitest';
import { CHARACTER_CONFIGS, CharacterType } from '@/domain/entities/Character';

describe('CHARACTER_CONFIGS', () => {
  const characterTypes: CharacterType[] = ['dog', 'cat', 'rabbit', 'bird'];

  it.each(characterTypes)('%s の設定が存在する', (type) => {
    const config = CHARACTER_CONFIGS[type];
    expect(config).toBeDefined();
    expect(config.type).toBe(type);
    expect(config.name).toBeTruthy();
  });

  it.each(characterTypes)('%s のメッセージが全て定義されている', (type) => {
    const config = CHARACTER_CONFIGS[type];
    const requiredMessages = [
      'medicationReminder',
      'missedMedication',
      'medicationComplete',
      'exerciseCheer',
      'lowStock',
      'appointmentReminder',
      'vaccineReminder',
      'checkupReminder',
    ] as const;

    for (const key of requiredMessages) {
      expect(config.messages[key]).toBeTruthy();
    }
  });

  it.each(characterTypes)('%s のサウンドパスが全て定義されている', (type) => {
    const config = CHARACTER_CONFIGS[type];
    expect(config.sounds.normal).toBeTruthy();
    expect(config.sounds.medicationReminder).toBeTruthy();
    expect(config.sounds.missedMedication).toBeTruthy();
    expect(config.sounds.medicationComplete).toBeTruthy();
    expect(config.sounds.exerciseCheer).toBeTruthy();
  });
});
