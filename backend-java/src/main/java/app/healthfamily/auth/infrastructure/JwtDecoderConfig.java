package app.healthfamily.auth.infrastructure;

import com.nimbusds.jose.JWSAlgorithm;
import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.core.OAuth2Error;

/**
 * 2 種類の JWT デコーダを組み立てる。
 *
 * <ul>
 *   <li><b>googleIdTokenDecoder</b>：Google の ID トークン (RS256)。公開鍵は JWKS から取得する</li>
 *   <li><b>appJwtDecoder</b>：自アプリのアクセストークン (HS256)。Go 版と同じ共有鍵</li>
 * </ul>
 *
 * <p>この 2 つは役割がまったく違う。ID トークンは「ログインしたのが誰か」を一度だけ確かめるもので、
 * API のアクセス制御には自アプリのトークンを使う。
 */
@Configuration
@EnableConfigurationProperties(GoogleOidcProperties.class)
public class JwtDecoderConfig {

    /** Google の ID トークン検証用。署名・iss・aud・exp をすべて検証する。 */
    @Bean
    public JwtDecoder googleIdTokenDecoder(GoogleOidcProperties properties) {
        NimbusJwtDecoder decoder =
                NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri())
                        .jwsAlgorithm(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256)
                        .build();
        decoder.setJwtValidator(
                new DelegatingValidator(
                        new JwtTimestampValidator(),
                        issuerValidator(properties),
                        audienceValidator(properties)));
        return decoder;
    }

    /** 自アプリのアクセストークン検証用。 */
    @Bean
    public JwtDecoder appJwtDecoder(@Value("${healthfamily.jwt.secret}") String secret) {
        var key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder =
                NimbusJwtDecoder.withSecretKey(key)
                        .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256)
                        .build();
        // Go 版は iss / aud を入れていないため、期限のみ検証する
        decoder.setJwtValidator(JwtValidators.createDefault());
        return decoder;
    }

    /** Google は iss を 2 通りの表記で返しうるので、どちらも許容する。 */
    private static OAuth2TokenValidator<Jwt> issuerValidator(GoogleOidcProperties properties) {
        return jwt ->
                properties.issuers().contains(jwt.getIssuer() == null ? null : jwt.getIssuer().toString())
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                                new OAuth2Error(
                                        "invalid_issuer",
                                        "iss が期待する発行者と一致しません",
                                        null));
    }

    /** aud が自分の client_id でないトークンは、他所向けに発行されたもの。受け入れてはならない。 */
    private static OAuth2TokenValidator<Jwt> audienceValidator(GoogleOidcProperties properties) {
        return jwt ->
                jwt.getAudience() != null && jwt.getAudience().contains(properties.clientId())
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                                new OAuth2Error(
                                        "invalid_audience",
                                        "aud が自分の client_id と一致しません",
                                        null));
    }

    /** 検証器をまとめて適用する。1 つでも失敗したら不合格。 */
    private record DelegatingValidator(OAuth2TokenValidator<Jwt>... validators)
            implements OAuth2TokenValidator<Jwt> {

        @SafeVarargs
        private DelegatingValidator {}

        @Override
        public OAuth2TokenValidatorResult validate(Jwt token) {
            for (OAuth2TokenValidator<Jwt> validator : validators) {
                OAuth2TokenValidatorResult result = validator.validate(token);
                if (result.hasErrors()) {
                    return result;
                }
            }
            return OAuth2TokenValidatorResult.success();
        }
    }

    /** Google のトークンエンドポイントを叩く HTTP クライアント。 */
    @Bean
    public org.springframework.web.client.RestClient googleRestClient() {
        return org.springframework.web.client.RestClient.create();
    }

    /** JwtClaimNames を参照しておくことで、クレーム名の定数を明示する */
    static final String SUBJECT_CLAIM = JwtClaimNames.SUB;
}
