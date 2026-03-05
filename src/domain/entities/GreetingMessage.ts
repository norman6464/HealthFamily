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
}
