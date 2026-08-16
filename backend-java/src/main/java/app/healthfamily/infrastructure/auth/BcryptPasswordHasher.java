package app.healthfamily.infrastructure.auth;

import app.healthfamily.domain.auth.PasswordHasher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * bcrypt によるパスワードのハッシュ化。
 *
 * <p>コストは 12。Go 版・Next.js 版と揃えており、既存利用者のハッシュを
 * そのまま検証できる。
 */
@Component
public class BcryptPasswordHasher implements PasswordHasher {

    /** 既存のハッシュと互換にするための固定値 */
    private static final int COST = 12;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(COST);

    @Override
    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String hashedPassword) {
        // Google ログイン専用の利用者はハッシュが空文字。
        // encoder に空文字を渡すと警告ログが出るだけで false になるが、
        // 意図を明示するためここで弾く
        if (hashedPassword == null || hashedPassword.isEmpty()) {
            return false;
        }
        return encoder.matches(rawPassword, hashedPassword);
    }
}
