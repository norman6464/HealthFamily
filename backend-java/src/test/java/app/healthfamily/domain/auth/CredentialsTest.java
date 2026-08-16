package app.healthfamily.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("資格情報")
class CredentialsTest {

    @Nested
    @DisplayName("メールアドレス")
    class Emails {

        @Test
        @DisplayName("小文字に正規化し、前後の空白を落とす")
        void normalizes() {
            assertThat(EmailAddress.of("  User@Example.COM ").value()).isEqualTo("user@example.com");
        }

        @Test
        @DisplayName("正規化後に等しければ同一とみなす")
        void equalityIgnoresCaseAndSpace() {
            assertThat(EmailAddress.of("A@b.com")).isEqualTo(EmailAddress.of(" a@B.COM "));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "no-at-mark", "@example.com", "user@", "a b@example.com"})
        @DisplayName("形式が不正なものは受け付けない")
        void invalidIsRejected(String raw) {
            assertThatThrownBy(() -> EmailAddress.of(raw))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("null は受け付けない")
        void nullIsRejected() {
            assertThatThrownBy(() -> EmailAddress.of(null))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("長すぎるアドレスは受け付けない")
        void tooLongIsRejected() {
            assertThatThrownBy(() -> EmailAddress.of("a".repeat(250) + "@example.com"))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }

    @Nested
    @DisplayName("パスワード")
    class Passwords {

        @Test
        @DisplayName("8文字以上なら受け付ける")
        void minimumLength() {
            assertThat(RawPassword.of("12345678").value()).isEqualTo("12345678");
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "1234567"})
        @DisplayName("8文字未満は受け付けない")
        void tooShortIsRejected(String raw) {
            assertThatThrownBy(() -> RawPassword.of(raw))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("8文字");
        }

        @Test
        @DisplayName("null は受け付けない")
        void nullIsRejected() {
            assertThatThrownBy(() -> RawPassword.of(null))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("bcrypt が黙って切り捨てる長さは受け付けない")
        void tooLongIsRejected() {
            // bcrypt は 72 バイトを超える分を無視する。
            // 許すと「長いパスワードにしたのに実は先頭72バイトだけ」という状態になる
            assertThatThrownBy(() -> RawPassword.of("a".repeat(73)))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("72");
        }

        @Test
        @DisplayName("マルチバイトはバイト長で判定する")
        void countsBytesNotChars() {
            // 日本語1文字は UTF-8 で3バイト。24文字で72バイト
            assertThat(RawPassword.of("あ".repeat(24)).value()).hasSize(24);
            assertThatThrownBy(() -> RawPassword.of("あ".repeat(25)))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("文字列表現に中身を出さない")
        void doesNotLeakInToString() {
            assertThat(RawPassword.of("secret-password").toString()).doesNotContain("secret");
        }
    }
}
