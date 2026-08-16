package app.healthfamily.auth.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.healthfamily.TestcontainersConfiguration;
import app.healthfamily.auth.domain.AuthorizationCodeGrant;
import app.healthfamily.auth.domain.GoogleIdentity;
import app.healthfamily.auth.domain.GoogleTokenExchanger;
import app.healthfamily.shared.DomainException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

/**
 * 認可コードグラントのコールバックと、API の認可設定を検証する。
 *
 * <p>Google との通信は差し替える。ここで確かめたいのは HTTP の境界であって、
 * Google が正しく応答するかではない。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AuthControllerIT.StubExchangerConfig.class})
@DisplayName("認証エンドポイント")
class AuthControllerIT {

    private static final String VERIFIER = "v".repeat(43);

    /** 交換結果を差し替える。テストごとに identity を書き換えて使う */
    static class StubExchanger implements GoogleTokenExchanger {
        GoogleIdentity identity;
        RuntimeException failure;

        @Override
        public GoogleIdentity exchange(AuthorizationCodeGrant grant) {
            if (failure != null) {
                throw failure;
            }
            return identity;
        }
    }

    @TestConfiguration
    static class StubExchangerConfig {
        @Bean
        @Primary
        StubExchanger stubExchanger() {
            return new StubExchanger();
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired StubExchanger exchanger;
    @Autowired JdbcClient jdbc;

    @BeforeEach
    void reset() {
        jdbc.sql("TRUNCATE \"MedicationRecord\", \"Medication\", \"Member\", \"User\" CASCADE")
                .update();
        exchanger.failure = null;
        exchanger.identity = new GoogleIdentity("sub-1", "new@example.com", true, "拓真");
    }

    private String body(String code, String verifier, String redirectUri) {
        return """
               {"code":"%s","codeVerifier":"%s","redirectUri":"%s"}
               """.formatted(code, verifier, redirectUri);
    }

    @Test
    @DisplayName("認可コードを渡すとトークンとユーザーが返る")
    void callbackIssuesToken() throws Exception {
        mockMvc.perform(
                        post("/api/auth/google/callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("code-1", VERIFIER, "https://app.example/callback")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("new@example.com"))
                .andExpect(jsonPath("$.data.user.emailVerified").value(true));

        Long saved =
                jdbc.sql("SELECT count(*) FROM \"User\" WHERE \"googleId\" = 'sub-1'")
                        .query(Long.class)
                        .single();
        assertThat(saved).isEqualTo(1);
    }

    @Test
    @DisplayName("ログイン導線は認証なしで到達できる")
    void callbackIsPublic() throws Exception {
        mockMvc.perform(
                        post("/api/auth/google/callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("code-1", VERIFIER, "https://app.example/callback")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("code_verifier が短すぎると 400 を返す")
    void shortVerifierIsRejected() throws Exception {
        mockMvc.perform(
                        post("/api/auth/google/callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("code-1", "short", "https://app.example/callback")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("メール未確認の Google アカウントは 403")
    void unverifiedEmailIsForbidden() throws Exception {
        exchanger.identity = new GoogleIdentity("sub-2", "unverified@example.com", false, null);

        mockMvc.perform(
                        post("/api/auth/google/callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("code-1", VERIFIER, "https://app.example/callback")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(
                        org.hamcrest.Matchers.containsString("確認されていません")));
    }

    @Test
    @DisplayName("トークン交換に失敗しても、内部の詳細は返さない")
    void exchangeFailureIsOpaque() throws Exception {
        exchanger.failure = DomainException.validation("Google認証に失敗しました");

        mockMvc.perform(
                        post("/api/auth/google/callback")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body("stolen-code", VERIFIER, "https://app.example/callback")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Google認証に失敗しました"));
    }

    @Test
    @DisplayName("保護された API はトークン無しでは 401")
    void protectedEndpointRequiresToken() throws Exception {
        mockMvc.perform(get("/api/medications")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("ヘルスチェックは認証不要")
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
