package app.healthfamily.domain.notification;

/**
 * 通知の種類。
 *
 * <p>種類ごとに可否を持つのは、利用者が「飲み忘れだけは知らせてほしいが、
 * 予約の通知はいらない」といった選び方をするため。
 */
public enum NotificationKind {
    /** 服薬時刻のリマインダー */
    MEDICATION_REMINDER,
    /** 飲み忘れの検知 */
    MISSED_MEDICATION,
    /** 通院予定のリマインダー */
    APPOINTMENT_REMINDER,
    /** 薬の残数が少ないことの通知 */
    LOW_STOCK
}
