package app.healthfamily.domain.auth;

import app.healthfamily.domain.shared.DomainException;
import java.util.Locale;
import java.util.Optional;

/**
 * 利用者の集約ルート。
 *
 * <p>Google ログイン専用ユーザーはパスワードを空文字で保持する。
 * bcrypt の検証は空ハッシュに対して必ず失敗するため、パスワードログインは成立しない。
 * Go 版と同じ扱いにして、両バックエンドが同じ行を読めるようにしている。
 */
public class User {

    /** Google ログイン専用ユーザーのパスワード列。ログイン不能であることを表す */
    public static final String NO_PASSWORD = "";

    private static final String DEFAULT_CHARACTER = "cat";

    private final String id;
    private final String email;
    private final String characterType;

    private String displayName;
    private String googleId;
    private boolean emailVerified;
    private VerificationCode verificationCode;
    private VerificationCode resetCode;
    private String password;

    private User(
            String id,
            String email,
            String password,
            String displayName,
            String characterType,
            String googleId,
            boolean emailVerified) {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("ユーザーIDは必須です");
        }
        if (email == null || email.isBlank()) {
            throw DomainException.validation("メールアドレスは必須です");
        }
        this.id = id;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.password = password == null ? NO_PASSWORD : password;
        this.displayName = displayName;
        this.characterType = characterType == null ? DEFAULT_CHARACTER : characterType;
        this.googleId = googleId;
        this.emailVerified = emailVerified;
    }

    /** 永続化層からの再構築。 */
    public static User reconstitute(
            String id,
            String email,
            String password,
            String displayName,
            String characterType,
            String googleId,
            boolean emailVerified) {
        return new User(id, email, password, displayName, characterType, googleId, emailVerified);
    }

    /** メールアドレスとパスワードで新規登録する。認証は未完了の状態で作る。 */
    public static User registerWithPassword(
            String id, String email, String hashedPassword, String displayName) {
        return new User(id, email, hashedPassword, displayName, DEFAULT_CHARACTER, null, false);
    }

    /**
     * Google アカウントから新規登録する。
     *
     * <p>Google 側でメールの所有確認が済んでいることが前提なので、
     * こちらでの確認メールは不要。最初から確認済みとして作る。
     */
    public static User registerFromGoogle(String id, GoogleIdentity identity) {
        identity.requireVerifiedEmail();
        return new User(
                id,
                identity.email(),
                NO_PASSWORD,
                identity.displayName().orElse(null),
                DEFAULT_CHARACTER,
                identity.subject(),
                true);
    }

    /**
     * 既存アカウントに Google アカウントを紐付ける。
     *
     * <p>すでに別の Google アカウントが紐付いている場合は拒否する。
     * 同じメールアドレスを持つ別の Google アカウントによる乗っ取りを防ぐため。
     */
    public void linkGoogle(GoogleIdentity identity) {
        identity.requireVerifiedEmail();
        if (googleId != null && !googleId.equals(identity.subject())) {
            throw DomainException.conflict(
                    "このメールアドレスには別のGoogleアカウントが紐付いています");
        }
        this.googleId = identity.subject();
        this.emailVerified = true;
        if (displayName == null || displayName.isBlank()) {
            identity.displayName().ifPresent(n -> this.displayName = n);
        }
    }

    /**
     * 認証コードを発行しなおす。
     *
     * <p>未認証の利用者にだけ許す。認証済みの利用者にコードを発行できると、
     * メールアドレスを知っているだけで登録内容を書き換えられてしまう。
     */
    public VerificationCode issueVerificationCode(java.time.Instant now) {
        if (emailVerified) {
            throw DomainException.conflict("すでに認証が完了しています");
        }
        this.verificationCode = VerificationCode.issue(now);
        return this.verificationCode;
    }

    /**
     * 認証コードを照合し、一致すれば認証済みにする。
     *
     * <p>認証済みかどうかに関わらず、必ずコードを検証する。
     * 「すでに認証済みなら素通し」にすると、メールアドレスを知っているだけで
     * 任意のアカウントのトークンを得られる。
     */
    public void confirmEmail(String candidate, java.time.Instant now) {
        if (verificationCode == null || !verificationCode.matches(candidate, now)) {
            throw DomainException.validation("認証コードが正しくないか、有効期限が切れています");
        }
        this.emailVerified = true;
        this.verificationCode = null;
    }

    /** パスワード再設定コードを発行する。認証状態は問わない。 */
    public VerificationCode issueResetCode(java.time.Instant now) {
        this.resetCode = VerificationCode.issue(now);
        return this.resetCode;
    }

    /** 再設定コードを照合し、一致すればパスワードを差し替える。 */
    public void resetPassword(String candidate, String newHashedPassword, java.time.Instant now) {
        if (resetCode == null || !resetCode.matches(candidate, now)) {
            throw DomainException.validation("再設定コードが正しくないか、有効期限が切れています");
        }
        this.password = newHashedPassword;
        this.resetCode = null;
    }

    /** 未認証の利用者の登録内容を差し替える。認証済みには使わせない。 */
    public void replacePendingRegistration(String hashedPassword, String newDisplayName) {
        if (emailVerified) {
            throw DomainException.conflict("すでに認証が完了しています");
        }
        this.password = hashedPassword;
        if (newDisplayName != null && !newDisplayName.isBlank()) {
            this.displayName = newDisplayName;
        }
    }

    public java.util.Optional<VerificationCode> verificationCode() {
        return java.util.Optional.ofNullable(verificationCode);
    }

    public java.util.Optional<VerificationCode> resetCode() {
        return java.util.Optional.ofNullable(resetCode);
    }

    public String id() {
        return id;
    }

    public String email() {
        return email;
    }

    public String password() {
        return password;
    }

    public String characterType() {
        return characterType;
    }

    public Optional<String> displayName() {
        return Optional.ofNullable(displayName);
    }

    public Optional<String> googleId() {
        return Optional.ofNullable(googleId);
    }

    public boolean emailVerified() {
        return emailVerified;
    }
}
