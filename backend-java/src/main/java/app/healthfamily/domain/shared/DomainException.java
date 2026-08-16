package app.healthfamily.domain.shared;

/**
 * ドメイン層が投げる例外。
 *
 * <p>HTTP のステータスコードはここでは決めない。web 層の例外ハンドラが対応付ける。
 * ドメインが「見つからない」「権限がない」までを表現し、それが 404 なのか 403 なのかは
 * 外側の関心事とする。
 */
public sealed class DomainException extends RuntimeException {

    private DomainException(String message) {
        super(message);
    }

    /** 対象が存在しない。 */
    public static final class NotFound extends DomainException {
        public NotFound(String subject) {
            super(subject + "が見つかりません");
        }
    }

    /** 対象は存在するが、操作する権限がない。 */
    public static final class Forbidden extends DomainException {
        public Forbidden(String message) {
            super(message);
        }
    }

    /** 入力値がドメインの制約を満たさない。 */
    public static final class Validation extends DomainException {
        public Validation(String message) {
            super(message);
        }
    }

    /** 現在の状態では、その操作を実行できない（不変条件違反）。 */
    public static final class Conflict extends DomainException {
        public Conflict(String message) {
            super(message);
        }
    }

    public static NotFound notFound(String subject) {
        return new NotFound(subject);
    }

    public static Forbidden forbidden(String message) {
        return new Forbidden(message);
    }

    public static Validation validation(String message) {
        return new Validation(message);
    }

    public static Conflict conflict(String message) {
        return new Conflict(message);
    }
}
