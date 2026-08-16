package app.healthfamily.domain.schedule;

/**
 * 飲み忘れの深刻度。
 *
 * <p>通知の強さを変えるために段階を持つ。閾値はフロントの表示ロジックから移してきたもので、
 * サーバー側で判定することで端末の時計に依存しなくなる。
 */
public enum OverdueLevel {
    NONE,
    /** 30分以上の超過 */
    WARNING,
    /** 60分以上の超過 */
    DANGER
}
