package app.healthfamily.domain.schedule;

/** 1回ぶんの服用の状況。 */
public enum DoseStatus {
    /** まだ予定時刻が来ていない */
    PENDING,
    /** 記録済み */
    COMPLETED,
    /** 予定時刻を過ぎたのに記録が無い */
    OVERDUE
}
