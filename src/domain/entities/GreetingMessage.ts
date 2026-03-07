/**
 * 挨拶メッセージ生成エンティティ
 */

export class GreetingMessageEntity {
  private static readonly GREETING_INTENSITY_HIGH_THRESHOLD = 70;
  private static readonly GREETING_INTENSITY_MODERATE_THRESHOLD = 40;
  private static readonly VARIETY_HIGH_THRESHOLD = 80;
  private static readonly VARIETY_MODERATE_THRESHOLD = 40;
  private static readonly GREETING_INTENSITY_MAX_HOURS = 72;
  private static readonly GREETING_INTENSITY_MAX_STREAK = 30;
  private static readonly GREETING_INTENSITY_HOURS_WEIGHT = 0.6;
  private static readonly GREETING_INTENSITY_STREAK_WEIGHT = 0.4;

  /**
   * 時間帯に応じた挨拶を返す
   */
  static getTimeGreeting(hour: number): string {
    if (hour >= 5 && hour < 12) return 'おはよう';
    if (hour >= 12 && hour < 18) return 'こんにちは';
    return 'こんばんは';
  }

  /**
   * 週間達成率に応じたサマリーメッセージを返す
   */
  static getWeeklySummaryMessage(weeklyRate: number | null): string {
    if (weeklyRate === null) return '今日もお薬を忘れずに';

    if (weeklyRate >= 90) return '素晴らしい1週間です。この調子で続けましょう';
    if (weeklyRate >= 70) return '順調にお薬を服用できています';
    if (weeklyRate >= 50) return '少しずつ習慣にしていきましょう';
    return '一緒に頑張りましょう。無理せず続けることが大切です';
  }

  /**
   * 曜日に応じたメッセージを返す
   */
  static getDayOfWeekMessage(dayOfWeek: number): string {
    switch (dayOfWeek) {
      case 0: return 'ゆっくり休めていますか';
      case 1: return '新しい週の始まりです';
      case 5: return 'あと少しで週末です';
      case 6: return 'お疲れさまでした';
      default: return '今日も頑張りましょう';
    }
  }

  /**
   * 月に基づく季節の挨拶を返す
   */
  static getSeasonalGreeting(month: number): string {
    if (month >= 3 && month <= 5) return '春の陽気が気持ちいい季節ですね';
    if (month >= 6 && month <= 8) return '暑い日が続きますが体調にお気をつけて';
    if (month >= 9 && month <= 11) return '過ごしやすい季節になりましたね';
    return '寒い日が続きますがお体ご自愛ください';
  }

  /**
   * 連続日数に応じた励ましメッセージを返す
   */
  static getStreakEncouragement(streak: number): string {
    if (streak === 0) return '今日から記録を始めましょう';
    if (streak === 7) return '1週間達成です。習慣になってきましたね';
    if (streak < 7) return `${streak}日連続です。良い調子です`;
    if (streak < 30) return `${streak}日連続です。素晴らしい継続力です`;
    return `${streak}日連続達成です。立派な習慣です`;
  }

  /**
   * 名前付きの挨拶文を生成する
   */
  static formatGreetingWithName(greeting: string, name: string | null): string {
    if (!name || name === '') return greeting;
    return `${name}さん、${greeting}`;
  }

  /**
   * ログイン間隔とストリークから挨拶強度スコアを算出する（0-100）
   */
  static getGreetingIntensityScore(
    hoursSinceLastLogin: number,
    streak: number
  ): number {
    if (hoursSinceLastLogin <= 0 && streak <= 0) return 0;
    const hoursNorm = Math.min(
      hoursSinceLastLogin / GreetingMessageEntity.GREETING_INTENSITY_MAX_HOURS,
      1
    );
    const streakNorm = Math.min(
      streak / GreetingMessageEntity.GREETING_INTENSITY_MAX_STREAK,
      1
    );
    const score =
      hoursNorm * GreetingMessageEntity.GREETING_INTENSITY_HOURS_WEIGHT +
      streakNorm * GreetingMessageEntity.GREETING_INTENSITY_STREAK_WEIGHT;
    return Math.max(0, Math.min(100, Math.round(score * 100)));
  }

  /**
   * 挨拶強度スコアに応じたラベルを返す
   */
  static getGreetingIntensityScoreLabel(score: number): string {
    if (score >= GreetingMessageEntity.GREETING_INTENSITY_HIGH_THRESHOLD) return '熱烈';
    if (score >= GreetingMessageEntity.GREETING_INTENSITY_MODERATE_THRESHOLD) return '普通';
    return '軽め';
  }

  /**
   * 使用した挨拶種類数から多様性スコアを算出する（0-100）
   */
  static getGreetingVarietyScore(usedTypes: number, totalTypes: number): number {
    if (totalTypes <= 0 || usedTypes <= 0) return 0;
    return Math.min(100, Math.round((usedTypes / totalTypes) * 100));
  }

  /**
   * 挨拶多様性スコアに応じたラベルを返す
   */
  static getGreetingVarietyScoreLabel(score: number): string {
    if (score >= GreetingMessageEntity.VARIETY_HIGH_THRESHOLD) return '豊富';
    if (score >= GreetingMessageEntity.VARIETY_MODERATE_THRESHOLD) return '普通';
    return '少ない';
  }
}
