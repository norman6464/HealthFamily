export type CharacterType = 'dog' | 'cat' | 'rabbit' | 'bird';

export type CharacterMood =
  | 'happy'
  | 'excited'
  | 'normal'
  | 'reminding'
  | 'worried'
  | 'sad'
  | 'cheering';

export interface CharacterConfig {
  type: CharacterType;
  name: string;
  sounds: {
    normal: string;
    medicationReminder: string;
    missedMedication: string;
    medicationComplete: string;
    exerciseCheer: string;
  };
  messages: {
    medicationReminder: string;
    missedMedication: string;
    medicationComplete: string;
    exerciseCheer: string;
    lowStock: string;
    appointmentReminder: string;
    vaccineReminder: string;
    checkupReminder: string;
  };
}

export const CHARACTER_CONFIGS: Record<CharacterType, CharacterConfig> = {
  dog: {
    type: 'dog',
    name: 'いぬ',
    sounds: {
      normal: '/sounds/dog/bark.mp3',
      medicationReminder: '/sounds/dog/reminder.mp3',
      missedMedication: '/sounds/dog/missed.mp3',
      medicationComplete: '/sounds/dog/complete.mp3',
      exerciseCheer: '/sounds/dog/cheer.mp3',
    },
    messages: {
      medicationReminder: 'ワンッ！お薬の時間だよ',
      missedMedication: 'クゥーン...お薬まだ飲んでないよ？',
      medicationComplete: 'ワン！よくできたね！',
      exerciseCheer: 'ワンワン！よく頑張ったね！',
      lowStock: 'ワンッ！お薬が少なくなってきたよ',
      appointmentReminder: 'ワン！今日は病院の日だよ',
      vaccineReminder: 'ワン！もうすぐ注射の日だよ',
      checkupReminder: 'ワン！健康診断の日だよ',
    },
  },
  cat: {
    type: 'cat',
    name: 'ねこ',
    sounds: {
      normal: '/sounds/cat/meow.mp3',
      medicationReminder: '/sounds/cat/reminder.mp3',
      missedMedication: '/sounds/cat/missed.mp3',
      medicationComplete: '/sounds/cat/complete.mp3',
      exerciseCheer: '/sounds/cat/cheer.mp3',
    },
    messages: {
      medicationReminder: 'ニャー、お薬の時間だよ',
      missedMedication: 'ニャッ！お薬まだ飲んでないよ？',
      medicationComplete: 'ゴロゴロ...えらいね',
      exerciseCheer: 'ニャー！よく頑張ったね',
      lowStock: 'ニャー、お薬が少なくなってきたよ',
      appointmentReminder: 'ニャー、今日は病院の日だよ',
      vaccineReminder: 'ニャー、もうすぐ注射の日だよ',
      checkupReminder: 'ニャー、健康診断の日だよ',
    },
  },
  rabbit: {
    type: 'rabbit',
    name: 'うさぎ',
    sounds: {
      normal: '/sounds/rabbit/squeak.mp3',
      medicationReminder: '/sounds/rabbit/reminder.mp3',
      missedMedication: '/sounds/rabbit/missed.mp3',
      medicationComplete: '/sounds/rabbit/complete.mp3',
      exerciseCheer: '/sounds/rabbit/cheer.mp3',
    },
    messages: {
      medicationReminder: 'プウプウ、お薬の時間だよ',
      missedMedication: 'ダンダンッ！お薬まだ飲んでないよ？',
      medicationComplete: 'プウプウ...えらいね',
      exerciseCheer: 'プウプウ！よく頑張ったね',
      lowStock: 'プウプウ、お薬が少なくなってきたよ',
      appointmentReminder: 'プウプウ、今日は病院の日だよ',
      vaccineReminder: 'プウプウ、もうすぐ注射の日だよ',
      checkupReminder: 'プウプウ、健康診断の日だよ',
    },
  },
  bird: {
    type: 'bird',
    name: 'インコ',
    sounds: {
      normal: '/sounds/bird/chirp.mp3',
      medicationReminder: '/sounds/bird/reminder.mp3',
      missedMedication: '/sounds/bird/missed.mp3',
      medicationComplete: '/sounds/bird/complete.mp3',
      exerciseCheer: '/sounds/bird/cheer.mp3',
    },
    messages: {
      medicationReminder: 'ピピッ！お薬の時間だよ',
      missedMedication: 'ギャギャッ！お薬まだ飲んでないよ？',
      medicationComplete: 'ピィー！えらいね',
      exerciseCheer: 'ピピピッ！よく頑張ったね',
      lowStock: 'ピピッ！お薬が少なくなってきたよ',
      appointmentReminder: 'ピピッ！今日は病院の日だよ',
      vaccineReminder: 'ピピッ！もうすぐ注射の日だよ',
      checkupReminder: 'ピピッ！健康診断の日だよ',
    },
  },
};
