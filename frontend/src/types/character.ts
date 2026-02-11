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
  icon: string;
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
    icon: '🐕',
    sounds: {
      normal: '/sounds/dog/bark.mp3',
      medicationReminder: '/sounds/dog/reminder.mp3',
      missedMedication: '/sounds/dog/missed.mp3',
      medicationComplete: '/sounds/dog/complete.mp3',
      exerciseCheer: '/sounds/dog/cheer.mp3',
    },
    messages: {
      medicationReminder: 'わんわん！お薬の時間だよ！',
      missedMedication: 'きゃいんきゃいん！お薬忘れてるよ！',
      medicationComplete: 'わん！えらい！',
      exerciseCheer: 'わんわん！すごいね！',
      lowStock: 'わんわん！お薬が少なくなってるよ！病院に行こう！',
      appointmentReminder: 'わんわん！病院の日だよ！',
      vaccineReminder: 'わんわん！注射の日が近いよ！',
      checkupReminder: 'わんわん！健康診断だよ！',
    },
  },
  cat: {
    type: 'cat',
    name: 'ねこ',
    icon: '🐈️',
    sounds: {
      normal: '/sounds/cat/meow.mp3',
      medicationReminder: '/sounds/cat/reminder.mp3',
      missedMedication: '/sounds/cat/missed.mp3',
      medicationComplete: '/sounds/cat/complete.mp3',
      exerciseCheer: '/sounds/cat/cheer.mp3',
    },
    messages: {
      medicationReminder: 'にゃいにゃい！お薬の時間にゃ！',
      missedMedication: 'びゃいびゃい！お薬飲んでにゃ！',
      medicationComplete: 'にゃ〜ん♪',
      exerciseCheer: 'にゃいにゃい！頑張ったにゃ！',
      lowStock: 'にゃいにゃい！お薬少ないにゃ！病院行こうにゃい！',
      appointmentReminder: 'にゃいにゃい！病院の日だにゃ！',
      vaccineReminder: 'にゃいにゃい！注射の日が近いにゃ！',
      checkupReminder: 'にゃいにゃい！健康診断だにゃ！',
    },
  },
  rabbit: {
    type: 'rabbit',
    name: 'うさぎ',
    icon: '🐇',
    sounds: {
      normal: '/sounds/rabbit/squeak.mp3',
      medicationReminder: '/sounds/rabbit/reminder.mp3',
      missedMedication: '/sounds/rabbit/missed.mp3',
      medicationComplete: '/sounds/rabbit/complete.mp3',
      exerciseCheer: '/sounds/rabbit/cheer.mp3',
    },
    messages: {
      medicationReminder: 'ぴょんぴょん！お薬の時間だよ！',
      missedMedication: 'ぶぅぶぅ！お薬忘れてるよ！',
      medicationComplete: 'ぴょん♪',
      exerciseCheer: 'ぴょんぴょん！えらいね！',
      lowStock: 'ぴょんぴょん！お薬少ないよ！病院に行こう！',
      appointmentReminder: 'ぴょんぴょん！病院の日だよ！',
      vaccineReminder: 'ぴょんぴょん！注射の日が近いよ！',
      checkupReminder: 'ぴょんぴょん！健康診断だよ！',
    },
  },
  bird: {
    type: 'bird',
    name: 'インコ',
    icon: '🦜',
    sounds: {
      normal: '/sounds/bird/chirp.mp3',
      medicationReminder: '/sounds/bird/reminder.mp3',
      missedMedication: '/sounds/bird/missed.mp3',
      medicationComplete: '/sounds/bird/complete.mp3',
      exerciseCheer: '/sounds/bird/cheer.mp3',
    },
    messages: {
      medicationReminder: 'ぴよぴよ！お薬の時間だよ！',
      missedMedication: 'ぎゃーぎゃー！お薬飲んで！',
      medicationComplete: 'ぴー♪',
      exerciseCheer: 'ぴよぴよ！すごい！',
      lowStock: 'ぴよぴよ！お薬少ないよ！病院行こう！',
      appointmentReminder: 'ぴよぴよ！病院の日だよ！',
      vaccineReminder: 'ぴよぴよ！注射の日が近いよ！',
      checkupReminder: 'ぴよぴよ！健康診断だよ！',
    },
  },
};
