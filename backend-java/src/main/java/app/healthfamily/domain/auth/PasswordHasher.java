package app.healthfamily.domain.auth;

/**
 * パスワードのハッシュ化ポート。
 *
 * <p>アルゴリズムはドメインの関心ではない。実装は infrastructure に置く。
 */
public interface PasswordHasher {

    String hash(String rawPassword);

    /**
     * 平文とハッシュが一致するか。
     *
     * <p>Google ログイン専用の利用者はハッシュが空文字なので、必ず false になる。
     * パスワードログインの経路を持たないことを、この性質で担保している。
     */
    boolean matches(String rawPassword, String hashedPassword);
}
