package app.healthfamily.usecase.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.auth.EmailAddress;
import app.healthfamily.domain.auth.PasswordHasher;
import app.healthfamily.domain.auth.User;
import app.healthfamily.domain.auth.UserRepository;
import app.healthfamily.domain.auth.VerificationMailer;
import app.healthfamily.domain.shared.DomainException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("新規登録")
class SignUpUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-08-16T12:00:00Z");

    static final class InMemoryUsers implements UserRepository {
        final List<User> stored = new ArrayList<>();
        int creates;
        int updates;

        @Override
        public Optional<User> findByGoogleId(String googleId) {
            return stored.stream().filter(u -> u.googleId().filter(googleId::equals).isPresent()).findFirst();
        }

        @Override
        public Optional<User> findByEmail(String email) {
            String n = email.trim().toLowerCase(Locale.ROOT);
            return stored.stream().filter(u -> u.email().equals(n)).findFirst();
        }

        @Override
        public void create(User user) {
            creates++;
            stored.add(user);
        }

        @Override
        public void update(User user) {
            updates++;
        }
    }

    /** 送信した宛先とコードを記録するだけの偽物 */
    static final class RecordingMailer implements VerificationMailer {
        record Sent(String to, String code) {}

        final List<Sent> verifications = new ArrayList<>();
        final List<Sent> resets = new ArrayList<>();

        @Override
        public void sendVerificationCode(String to, String code) {
            verifications.add(new Sent(to, code));
        }

        @Override
        public void sendPasswordResetCode(String to, String code) {
            resets.add(new Sent(to, code));
        }
    }

    /**
     * ハッシュ化の中身はここでは問わないが、平文を含まない結果を返す。
     * 平文を含む偽物にすると「ハッシュ化されているか」の検証が意味を失う。
     */
    static final class FakeHasher implements PasswordHasher {
        @Override
        public String hash(String raw) {
            return "h$" + Integer.toHexString(raw.hashCode()) + "$" + raw.length();
        }

        @Override
        public boolean matches(String raw, String hashed) {
            return hashed.equals(hash(raw));
        }
    }

    private InMemoryUsers users;
    private RecordingMailer mailer;
    private SignUpUseCase useCase;

    @BeforeEach
    void setUp() {
        users = new InMemoryUsers();
        mailer = new RecordingMailer();
        useCase = new SignUpUseCase(users, new FakeHasher(), mailer, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Nested
    @DisplayName("新規のメールアドレス")
    class NewEmail {

        @Test
        @DisplayName("未認証の利用者を作り、認証コードを送る")
        void createsUnverifiedUserAndSendsCode() {
            useCase.execute(new SignUpUseCase.Command("New@Example.com", "password123", "拓真"));

            assertThat(users.creates).isEqualTo(1);
            var created = users.stored.getFirst();
            assertThat(created.email()).isEqualTo("new@example.com");
            assertThat(created.emailVerified()).isFalse();
            assertThat(created.displayName()).contains("拓真");
            assertThat(mailer.verifications).hasSize(1);
            assertThat(mailer.verifications.getFirst().to()).isEqualTo("new@example.com");
        }

        @Test
        @DisplayName("パスワードは平文で保存しない")
        void passwordIsHashed() {
            useCase.execute(new SignUpUseCase.Command("a@example.com", "password123", null));

            assertThat(users.stored.getFirst().password()).doesNotContain("password123");
        }

        @Test
        @DisplayName("送るコードは6桁")
        void codeIsSixDigits() {
            useCase.execute(new SignUpUseCase.Command("a@example.com", "password123", null));

            assertThat(mailer.verifications.getFirst().code()).matches("^[0-9]{6}$");
        }
    }

    @Nested
    @DisplayName("既に登録済みのメールアドレス")
    class ExistingEmail {

        @Test
        @DisplayName("認証済みの利用者がいても、その事実を漏らさない")
        void doesNotRevealVerifiedAccount() {
            users.create(
                    User.reconstitute("u-1", "taken@example.com", "h$abc$1", "既存", "cat", null, true));
            users.creates = 0;

            // 例外を投げない。呼び出し側からは新規登録と区別がつかない
            useCase.execute(new SignUpUseCase.Command("taken@example.com", "password123", "攻撃者"));

            assertThat(users.creates).isZero();
            assertThat(users.updates).as("既存の認証済みアカウントを書き換えてはならない").isZero();
            assertThat(mailer.verifications).as("メールも送らない").isEmpty();
        }

        @Test
        @DisplayName("未認証の利用者には認証コードを送り直す")
        void resendsForUnverified() {
            users.create(
                    User.reconstitute("u-2", "pending@example.com", "h$old$3", "本人", "cat", null, false));
            users.creates = 0;

            useCase.execute(new SignUpUseCase.Command("pending@example.com", "newpassword1", "本人"));

            assertThat(users.creates).isZero();
            assertThat(users.updates).isEqualTo(1);
            assertThat(mailer.verifications).hasSize(1);
        }

        @Test
        @DisplayName("未認証でも、表示名を省略したら既存の表示名を消さない")
        void keepsDisplayNameWhenOmitted() {
            var existing =
                    User.reconstitute("u-3", "pending2@example.com", "h$old$3", "元の名前", "cat", null, false);
            users.create(existing);

            useCase.execute(new SignUpUseCase.Command("pending2@example.com", "newpassword1", null));

            assertThat(existing.displayName()).contains("元の名前");
        }
    }

    @Nested
    @DisplayName("入力の検証")
    class Validation {

        @Test
        @DisplayName("メールの形式が不正なら拒否する")
        void invalidEmail() {
            assertThatThrownBy(
                            () -> useCase.execute(new SignUpUseCase.Command("bad", "password123", null)))
                    .isInstanceOf(DomainException.Validation.class);
            assertThat(users.creates).isZero();
        }

        @Test
        @DisplayName("パスワードが短ければ拒否する")
        void shortPassword() {
            assertThatThrownBy(
                            () -> useCase.execute(new SignUpUseCase.Command("a@example.com", "short", null)))
                    .isInstanceOf(DomainException.Validation.class);
            assertThat(users.creates).isZero();
        }

        @Test
        @DisplayName("検証に失敗したらメールも送らない")
        void noMailOnValidationFailure() {
            assertThatThrownBy(
                            () -> useCase.execute(new SignUpUseCase.Command("bad", "password123", null)))
                    .isInstanceOf(DomainException.class);
            assertThat(mailer.verifications).isEmpty();
        }
    }

    @Nested
    @DisplayName("正規化")
    class Normalization {

        @Test
        @DisplayName("大文字で登録しても小文字で見つかる")
        void storedLowercase() {
            useCase.execute(new SignUpUseCase.Command("MiXeD@Example.COM", "password123", null));

            assertThat(users.findByEmail("mixed@example.com")).isPresent();
            assertThat(users.findByEmail("MIXED@EXAMPLE.COM")).isPresent();
        }

        @Test
        @DisplayName("大文字違いで二重登録できない")
        void noDuplicateByCase() {
            useCase.execute(new SignUpUseCase.Command("dup@example.com", "password123", null));
            users.stored.getFirst();
            useCase.execute(new SignUpUseCase.Command("DUP@EXAMPLE.COM", "password123", null));

            assertThat(users.stored).hasSize(1);
        }
    }

    /** EmailAddress を直接使う箇所の確認 */
    @Test
    @DisplayName("宛先は正規化済みのアドレス")
    void mailerReceivesNormalizedAddress() {
        useCase.execute(new SignUpUseCase.Command(" Upper@Example.COM ", "password123", null));

        assertThat(mailer.verifications.getFirst().to())
                .isEqualTo(EmailAddress.of("upper@example.com").value());
    }
}
