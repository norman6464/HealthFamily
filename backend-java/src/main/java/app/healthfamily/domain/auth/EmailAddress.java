package app.healthfamily.domain.auth;

import app.healthfamily.domain.shared.DomainException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * メールアドレス。
 *
 * <p>正規化をこの型に閉じ込める。検索時と保存時で正規化の有無がずれると、
 * 「登録したのにログインできない」「同じ人が二重に登録される」が起きる。
 */
public record EmailAddress(String value) {

    // 厳密な RFC 準拠は目指さない。実在性はメール到達で確かめるため、
    // ここでは明らかにおかしいものを弾くだけにする
    private static final Pattern SHAPE = Pattern.compile("^[^\\s@]+@[^\\s@.]+(\\.[^\\s@.]+)+$");
    private static final int MAX_LENGTH = 254;

    public EmailAddress {
        if (value == null) {
            throw DomainException.validation("メールアドレスは必須です");
        }
        value = value.trim().toLowerCase(Locale.ROOT);
        if (value.length() > MAX_LENGTH) {
            throw DomainException.validation("メールアドレスが長すぎます");
        }
        if (!SHAPE.matcher(value).matches()) {
            throw DomainException.validation("メールアドレスの形式が正しくありません");
        }
    }

    public static EmailAddress of(String raw) {
        return new EmailAddress(raw);
    }

    @Override
    public String toString() {
        return value;
    }
}
