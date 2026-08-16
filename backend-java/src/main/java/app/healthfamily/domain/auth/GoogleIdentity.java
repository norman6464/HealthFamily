package app.healthfamily.domain.auth;

import app.healthfamily.domain.shared.DomainException;
import java.util.Locale;
import java.util.Optional;

/**
 * 検証済みの Google ID トークンから取り出した本人情報。
 *
 * <p>ここに到達している時点で、署名・iss・aud・exp の検証は済んでいる前提。
 * 未検証のトークンからこの型を作ってはならない。
 *
 * @param subject Google の安定したユーザー識別子。メールアドレスと違い変わらないため、
 *     アカウントの紐付けはこちらで行う
 */
public record GoogleIdentity(String subject, String email, boolean emailVerified, String name) {

    public GoogleIdentity {
        if (subject == null || subject.isBlank()) {
            throw DomainException.validation("Google の sub が取得できませんでした");
        }
        if (email == null || email.isBlank()) {
            throw DomainException.validation("Google のメールアドレスが取得できませんでした");
        }
        email = email.trim().toLowerCase(Locale.ROOT);
    }

    public Optional<String> displayName() {
        return Optional.ofNullable(name).filter(n -> !n.isBlank());
    }

    /**
     * このアカウントで既存ユーザーへの紐付けや新規作成を許してよいか。
     *
     * <p>Google 側でメールの所有確認が済んでいない場合に許すと、
     * 他人のメールアドレスを名乗って既存アカウントを乗っ取れてしまう。
     */
    public void requireVerifiedEmail() {
        if (!emailVerified) {
            throw DomainException.forbidden("Googleアカウントのメールアドレスが確認されていません");
        }
    }
}
