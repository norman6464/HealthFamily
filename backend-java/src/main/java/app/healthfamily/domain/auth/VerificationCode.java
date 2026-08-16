package app.healthfamily.domain.auth;

import app.healthfamily.domain.shared.DomainException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.regex.Pattern;

/**
 * メール認証・パスワード再設定に使う 6 桁コード。
 *
 * <p>コードの照合はこの型の中だけで行う。呼び出し側に文字列を渡して比較させると、
 * いずれ通常の {@code equals} で比較され、応答時間の差から 1 桁ずつ絞り込まれうる。
 *
 * @param value 6桁の数字
 * @param expiresAt 有効期限。この時刻まで有効（境界は含む）
 */
public record VerificationCode(String value, Instant expiresAt) {

    private static final Pattern SIX_DIGITS = Pattern.compile("^[0-9]{6}$");
    private static final Duration LIFETIME = Duration.ofMinutes(10);
    private static final SecureRandom RANDOM = new SecureRandom();

    public VerificationCode {
        if (value == null || !SIX_DIGITS.matcher(value).matches()) {
            throw DomainException.validation("認証コードは6桁の数字である必要があります");
        }
        if (expiresAt == null) {
            throw DomainException.validation("認証コードの有効期限は必須です");
        }
    }

    /**
     * 新しいコードを発行する。
     *
     * <p>乱数は {@link SecureRandom} を使う。予測可能なコードは、
     * メールを受け取っていない第三者に認証を通させてしまう。
     */
    public static VerificationCode issue(Instant now) {
        return new VerificationCode("%06d".formatted(RANDOM.nextInt(1_000_000)), now.plus(LIFETIME));
    }

    /** 保存済みの値から復元する。 */
    public static VerificationCode reconstitute(String value, Instant expiresAt) {
        return new VerificationCode(value, expiresAt);
    }

    /**
     * 入力されたコードが一致し、かつ期限内か。
     *
     * <p>比較は定数時間で行う。通常の文字列比較は先頭一致の長さで応答時間が変わるため、
     * 6桁のコードを1桁ずつ絞り込まれうる。
     */
    public boolean matches(String candidate, Instant now) {
        if (candidate == null || now.isAfter(expiresAt)) {
            return false;
        }
        return MessageDigest.isEqual(
                value.getBytes(StandardCharsets.UTF_8), candidate.getBytes(StandardCharsets.UTF_8));
    }

    public boolean isExpiredAt(Instant now) {
        return now.isAfter(expiresAt);
    }
}
