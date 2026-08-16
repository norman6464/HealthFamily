package app.healthfamily.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

import app.healthfamily.domain.shared.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("認証ドメイン")
class AuthDomainTest {

    private static final String VALID_VERIFIER = "a".repeat(43);

    private static GoogleIdentity verified() {
        return new GoogleIdentity("google-sub-1", "USER@Example.com ", true, "拓真");
    }

    private static GoogleIdentity unverified() {
        return new GoogleIdentity("google-sub-2", "unverified@example.com", false, null);
    }

    @Nested
    @DisplayName("AuthorizationCodeGrant")
    class Grant {

        @Test
        @DisplayName("正常な値なら作れる")
        void validGrant() {
            var grant = new AuthorizationCodeGrant("code-1", VALID_VERIFIER, "https://app/callback");

            assertThat(grant.code()).isEqualTo("code-1");
        }

        @ParameterizedTest
        @ValueSource(ints = {42, 129})
        @DisplayName("code_verifier は 43〜128 文字でなければならない")
        void verifierLengthIsEnforced(int length) {
            assertThatThrownBy(
                            () ->
                                    new AuthorizationCodeGrant(
                                            "code-1", "a".repeat(length), "https://app/callback"))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("43〜128");
        }

        @Test
        @DisplayName("code_verifier に使えない文字は弾く")
        void verifierCharsetIsEnforced() {
            assertThatThrownBy(
                            () ->
                                    new AuthorizationCodeGrant(
                                            "code-1", "+".repeat(43), "https://app/callback"))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("使用できない文字");
        }

        @Test
        @DisplayName("code_verifier は必須。PKCE 無しの交換は認めない")
        void verifierIsRequired() {
            assertThatThrownBy(
                            () -> new AuthorizationCodeGrant("code-1", null, "https://app/callback"))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("code_verifier");
        }

        @Test
        @DisplayName("redirect_uri は必須")
        void redirectUriIsRequired() {
            assertThatThrownBy(() -> new AuthorizationCodeGrant("code-1", VALID_VERIFIER, " "))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }

    @Nested
    @DisplayName("GoogleIdentity")
    class Identity {

        @Test
        @DisplayName("メールアドレスは小文字に正規化される")
        void emailIsNormalized() {
            assertThat(verified().email()).isEqualTo("user@example.com");
        }

        @Test
        @DisplayName("sub が無ければ作れない")
        void subjectIsRequired() {
            assertThatThrownBy(() -> new GoogleIdentity(" ", "a@example.com", true, null))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("メール未確認は拒否できる")
        void unverifiedEmailIsRejected() {
            assertThatThrownBy(() -> unverified().requireVerifiedEmail())
                    .isInstanceOf(DomainException.Forbidden.class)
                    .hasMessageContaining("確認されていません");
        }
    }

    @Nested
    @DisplayName("User")
    class Users {

        @Test
        @DisplayName("Google から新規登録すると確認済みで作られる")
        void registerFromGoogle() {
            var user = User.registerFromGoogle("user-1", verified());

            assertThat(user.email()).isEqualTo("user@example.com");
            assertThat(user.googleId()).contains("google-sub-1");
            assertThat(user.emailVerified()).isTrue();
            assertThat(user.displayName()).contains("拓真");
            assertThat(user.password()).isEqualTo(User.NO_PASSWORD);
            assertThat(user.characterType()).isEqualTo("cat");
        }

        @Test
        @DisplayName("メール未確認の Google アカウントでは新規登録できない")
        void registerRequiresVerifiedEmail() {
            assertThatThrownBy(() -> User.registerFromGoogle("user-1", unverified()))
                    .isInstanceOf(DomainException.Forbidden.class);
        }

        @Test
        @DisplayName("既存アカウントに Google を紐付けると確認済みになる")
        void linkGoogleToExisting() {
            var user =
                    User.reconstitute(
                            "user-1", "user@example.com", "hashed", null, "cat", null, false);

            user.linkGoogle(verified());

            assertThat(user.googleId()).contains("google-sub-1");
            assertThat(user.emailVerified()).isTrue();
            assertThat(user.displayName()).contains("拓真");
        }

        @Test
        @DisplayName("表示名が既にあれば Google の名前で上書きしない")
        void existingDisplayNameIsKept() {
            var user =
                    User.reconstitute(
                            "user-1", "user@example.com", "hashed", "自分の名前", "cat", null, false);

            user.linkGoogle(verified());

            assertThat(user.displayName()).contains("自分の名前");
        }

        @Test
        @DisplayName("同じ Google アカウントの再紐付けは何度でも通る")
        void relinkingSameAccountIsIdempotent() {
            var user =
                    User.reconstitute(
                            "user-1", "user@example.com", "", null, "cat", "google-sub-1", true);

            assertThatCode(() -> user.linkGoogle(verified())).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("別の Google アカウントの紐付けは拒否する")
        void linkingDifferentAccountIsRejected() {
            var user =
                    User.reconstitute(
                            "user-1", "user@example.com", "", null, "cat", "another-sub", true);

            assertThatThrownBy(() -> user.linkGoogle(verified()))
                    .isInstanceOf(DomainException.Conflict.class)
                    .hasMessageContaining("別のGoogleアカウント");
        }

        @Test
        @DisplayName("メール未確認の Google アカウントは紐付けられない")
        void linkRequiresVerifiedEmail() {
            var user =
                    User.reconstitute(
                            "user-1", "unverified@example.com", "h", null, "cat", null, false);

            assertThatThrownBy(() -> user.linkGoogle(unverified()))
                    .isInstanceOf(DomainException.Forbidden.class);
        }
    }
}
