package app.healthfamily.domain.auth;

import app.healthfamily.domain.shared.DomainException;
import java.nio.charset.StandardCharsets;

/**
 * ハッシュ化前のパスワード。
 *
 * <p>この型を持ち回るのはハッシュ化するまでの短い区間だけ。
 * ログや例外に漏れないよう {@link #toString()} で中身を出さない。
 */
public record RawPassword(String value) {

    private static final int MIN_LENGTH = 8;

    /** bcrypt は 72 バイトを超える分を黙って無視する */
    private static final int MAX_BYTES = 72;

    public RawPassword {
        if (value == null || value.length() < MIN_LENGTH) {
            throw DomainException.validation("パスワードは8文字以上で入力してください");
        }
        if (value.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            // 許すと「長くしたつもりが実は先頭72バイトだけ」という状態になる
            throw DomainException.validation("パスワードは72バイト以内で入力してください");
        }
    }

    public static RawPassword of(String raw) {
        return new RawPassword(raw);
    }

    /** 中身は絶対に出さない。 */
    @Override
    public String toString() {
        return "RawPassword(****)";
    }
}
