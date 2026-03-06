/**
 * 挨拶メッセージ生成エンティティ
 */

export class GreetingMessageEntity {
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
}
