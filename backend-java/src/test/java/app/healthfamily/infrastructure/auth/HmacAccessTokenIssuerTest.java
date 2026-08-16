package app.healthfamily.infrastructure.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.auth.User;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 発行したトークンが Go 版と同じ形になっていることを確かめる。
 * 移行中は両バックエンドが同じトークンを検証できる必要がある。
 */
@DisplayName("アクセストークンの発行")
class HmacAccessTokenIssuerTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";
    private static final Instant NOW = Instant.parse("2026-08-15T12:00:00Z");

    private static User user() {
        return User.reconstitute("user-1", "user@example.com", "", "拓真", "cat", "sub-1", true);
    }

    @Test
    @DisplayName("Go 版と同じクレーム（uid / email / sub）を持つ")
    void claimsMatchGoFormat() throws Exception {
        var token = new HmacAccessTokenIssuer(SECRET).issue(user(), NOW);

        var jwt = SignedJWT.parse(token);
        var claims = jwt.getJWTClaimsSet();

        assertThat(jwt.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.HS256);
        assertThat(claims.getStringClaim("uid")).isEqualTo("user-1");
        assertThat(claims.getStringClaim("email")).isEqualTo("user@example.com");
        assertThat(claims.getSubject()).isEqualTo("user-1");
    }

    @Test
    @DisplayName("有効期限は 7 日")
    void expiresInSevenDays() throws Exception {
        var token = new HmacAccessTokenIssuer(SECRET).issue(user(), NOW);

        var claims = SignedJWT.parse(token).getJWTClaimsSet();

        assertThat(claims.getIssueTime().toInstant()).isEqualTo(NOW);
        assertThat(claims.getExpirationTime().toInstant())
                .isEqualTo(NOW.plus(HmacAccessTokenIssuer.TTL));
    }

    @Test
    @DisplayName("同じ鍵で署名が検証できる")
    void signatureVerifies() throws Exception {
        var token = new HmacAccessTokenIssuer(SECRET).issue(user(), NOW);

        var verified =
                SignedJWT.parse(token)
                        .verify(new MACVerifier(SECRET.getBytes(StandardCharsets.UTF_8)));

        assertThat(verified).isTrue();
    }

    @Test
    @DisplayName("別の鍵では検証に失敗する")
    void wrongSecretFails() throws Exception {
        var token = new HmacAccessTokenIssuer(SECRET).issue(user(), NOW);

        var verified =
                SignedJWT.parse(token)
                        .verify(
                                new MACVerifier(
                                        "fedcba9876543210fedcba9876543210"
                                                .getBytes(StandardCharsets.UTF_8)));

        assertThat(verified).isFalse();
    }

    @Test
    @DisplayName("短すぎる鍵は起動時に弾く")
    void shortSecretIsRejected() {
        assertThatThrownBy(() -> new HmacAccessTokenIssuer("too-short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 バイト以上");
    }
}
