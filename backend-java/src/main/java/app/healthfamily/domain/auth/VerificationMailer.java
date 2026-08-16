package app.healthfamily.domain.auth;

/**
 * 認証コードの送信ポート。
 *
 * <p>送信手段はドメインの関心ではない。実装は infrastructure に置く。
 */
public interface VerificationMailer {

    void sendVerificationCode(String to, String code);

    void sendPasswordResetCode(String to, String code);
}
