package app.healthfamily.infrastructure.auth;

import app.healthfamily.config.GoogleOidcProperties;
import app.healthfamily.domain.auth.AuthorizationCodeGrant;
import app.healthfamily.domain.auth.GoogleIdentity;
import app.healthfamily.domain.auth.GoogleTokenExchanger;
import app.healthfamily.domain.shared.DomainException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * 認可コードを Google のトークンエンドポイントで交換し、ID トークンを検証する。
 *
 * <p>交換は <b>バックエンドから</b> 行う。ブラウザには認可コードしか渡らず、
 * client_secret も ID トークンも JavaScript から触れない。
 * これが Google Identity Services の ID トークン直接受け取りとの決定的な違い。
 *
 * <p>PKCE の code_verifier も同時に送る。認可コードを盗まれても、
 * 合言葉の本体を知らない攻撃者はトークンを取得できない（RFC 7636）。
 */
@Component
public class GoogleOidcTokenExchanger implements GoogleTokenExchanger {

    private static final Logger log = LoggerFactory.getLogger(GoogleOidcTokenExchanger.class);

    private final RestClient restClient;
    private final JwtDecoder idTokenDecoder;
    private final GoogleOidcProperties properties;

    public GoogleOidcTokenExchanger(
            @Qualifier("googleRestClient") RestClient restClient,
            @Qualifier("googleIdTokenDecoder") JwtDecoder googleIdTokenDecoder,
            GoogleOidcProperties properties) {
        this.restClient = restClient;
        this.idTokenDecoder = googleIdTokenDecoder;
        this.properties = properties;
    }

    @Override
    public GoogleIdentity exchange(AuthorizationCodeGrant grant) {
        if (!properties.enabled()) {
            throw DomainException.validation("Googleログインは現在利用できません");
        }
        String idToken = requestIdToken(grant);
        return toIdentity(verify(idToken));
    }

    private String requestIdToken(AuthorizationCodeGrant grant) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", grant.code());
        form.add("code_verifier", grant.codeVerifier());
        form.add("redirect_uri", grant.redirectUri());
        form.add("client_id", properties.clientId());
        if (properties.clientSecret() != null && !properties.clientSecret().isBlank()) {
            form.add("client_secret", properties.clientSecret());
        }

        Map<?, ?> body;
        try {
            body =
                    restClient
                            .post()
                            .uri(properties.tokenUri())
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                            .body(form)
                            .retrieve()
                            .body(Map.class);
        } catch (RestClientException e) {
            // 認可コードの使い回し・期限切れ・code_verifier 不一致はすべてここに来る。
            // 詳細を利用者へ返すと攻撃の手がかりになるため、ログにだけ残す
            log.warn("Google のトークン交換に失敗しました", e);
            throw DomainException.validation("Google認証に失敗しました");
        }

        Object idToken = body == null ? null : body.get("id_token");
        if (!(idToken instanceof String token) || token.isBlank()) {
            log.warn("トークンレスポンスに id_token が含まれていません");
            throw DomainException.validation("Google認証に失敗しました");
        }
        return token;
    }

    /** 署名・iss・aud・exp を検証する。ここを省くと偽造トークンを受け入れてしまう。 */
    private Jwt verify(String idToken) {
        try {
            return idTokenDecoder.decode(idToken);
        } catch (JwtException e) {
            log.warn("ID トークンの検証に失敗しました", e);
            throw DomainException.validation("Google認証に失敗しました");
        }
    }

    private GoogleIdentity toIdentity(Jwt jwt) {
        Object emailVerified = jwt.getClaim("email_verified");
        return new GoogleIdentity(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                Boolean.TRUE.equals(emailVerified) || "true".equals(String.valueOf(emailVerified)),
                jwt.getClaimAsString("name"));
    }
}
