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
  suffix: string;
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

const VALID_TYPES: CharacterType[] = ['dog', 'cat', 'rabbit', 'bird'];

export class CharacterEntity {
  private static readonly LOYALTY_HIGH_THRESHOLD = 80;
  private static readonly LOYALTY_MODERATE_THRESHOLD = 40;

  /**
   * 文字列がCharacterTypeか検証する
   */
  static isValidCharacterType(type: string): type is CharacterType {
    return VALID_TYPES.includes(type as CharacterType);
  }

  /**
   * タイプからConfigを取得する(無効時はdogをデフォルトで返す)
   */
  static getCharacterConfig(type: string): CharacterConfig {
    if (CharacterEntity.isValidCharacterType(type)) {
      return CHARACTER_CONFIGS[type];
    }
    return CHARACTER_CONFIGS.dog;
  }

  /**
   * 全キャラクタータイプのリストを返す
   */
  static getAllCharacterTypes(): CharacterType[] {
    return [...VALID_TYPES];
  }

  /**
   * 服薬遵守率に応じたムードを判定する
   */
  static getMoodByAdherence(rate: number): CharacterMood {
    if (rate >= 90) return 'happy';
    if (rate >= 70) return 'normal';
    if (rate >= 50) return 'reminding';
    if (rate >= 30) return 'worried';
    return 'sad';
  }

  /**
   * ムードの日本語ラベルを返す
   */
  static getMoodLabel(mood: CharacterMood): string {
    const labels: Record<CharacterMood, string> = {
      happy: '喜び',
      excited: '興奮',
      normal: '通常',
      reminding: 'お知らせ',
      worried: '心配',
      sad: '悲しみ',
      cheering: '応援',
    };
    return labels[mood];
  }

  /**
   * ムードに応じたメッセージを返す
   */
  static getMoodMessage(mood: CharacterMood): string {
    const messages: Record<CharacterMood, string> = {
      happy: 'とても良い調子です',
      excited: '素晴らしい成果です',
      normal: 'いつも通りです',
      reminding: 'お薬を忘れずに',
      worried: '少し心配しています',
      sad: '一緒に頑張りましょう',
      cheering: '応援しています',
    };
    return messages[mood];
  }

  /**
   * 時間帯に応じた挨拶テキストを返す
   */
  static getTimeBasedGreeting(hour: number): string {
    if (hour >= 5 && hour < 12) return 'おはようございます';
    if (hour >= 12 && hour < 18) return 'こんにちは';
    return 'こんばんは';
  }

  /**
   * 挨拶に含めるコンテキスト情報を構築する
   */
  static getGreetingContext(info: {
    pendingMedications: number;
    upcomingAppointments: number;
    memberName: string;
  }): string {
    const parts: string[] = [];
    if (info.pendingMedications > 0) {
      parts.push(`${info.memberName}さんの服薬が${info.pendingMedications}件あります`);
    }
    if (info.upcomingAppointments > 0) {
      parts.push(`通院予定が${info.upcomingAppointments}件あります`);
    }
    if (parts.length === 0) {
      return `${info.memberName}さんの今日の予定はありません`;
    }
    return parts.join('。');
  }

  /**
   * 挨拶テキストとコンテキストを組み合わせたメッセージを生成する
   */
  static buildGreetingMessage(
    hour: number,
    info: { pendingMedications: number; upcomingAppointments: number; memberName: string },
  ): string {
    const greeting = CharacterEntity.getTimeBasedGreeting(hour);
    const context = CharacterEntity.getGreetingContext(info);
    return `${greeting}、${info.memberName}さん。${context}`;
  }

  /**
   * キャラクター使用日数から忠誠度スコアを算出する（0-100）
   */
  static getCharacterLoyaltyScore(usageDays: number, totalDays: number): number {
    if (totalDays <= 0 || usageDays <= 0) return 0;
    return Math.min(100, Math.round((usageDays / totalDays) * 100));
  }

  /**
   * 忠誠度スコアに応じたラベルを返す
   */
  static getCharacterLoyaltyScoreLabel(score: number): string {
    if (score >= CharacterEntity.LOYALTY_HIGH_THRESHOLD) return '忠実';
    if (score >= CharacterEntity.LOYALTY_MODERATE_THRESHOLD) return '普通';
    return '浮気性';
  }
}

export const CHARACTER_CONFIGS: Record<CharacterType, CharacterConfig> = {
  dog: {
    type: 'dog',
    name: 'いぬ',
    suffix: 'ワン',
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
    suffix: 'ニャ',
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
    suffix: 'ピョン',
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
    suffix: 'ピィ',
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
