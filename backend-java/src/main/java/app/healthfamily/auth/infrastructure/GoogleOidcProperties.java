package app.healthfamily.auth.infrastructure;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Google OIDC の設定。
 *
 * @param clientId 認可リクエストと ID トークンの aud に使う
 * @param clientSecret バックエンドは秘密を保持できるので機密クライアントとして扱う。
 *     SPA 単体では持てないため、トークン交換をバックエンドに寄せている
 * @param tokenUri トークンエンドポイント
 * @param jwkSetUri ID トークンの署名検証に使う公開鍵の配布元
 * @param issuers 許容する iss。Google は 2 種類の表記を返しうる
 */
@ConfigurationProperties(prefix = "healthfamily.google-oidc")
public record GoogleOidcProperties(
        String clientId,
        String clientSecret,
        String tokenUri,
        String jwkSetUri,
        List<String> issuers) {

    public GoogleOidcProperties {
        if (tokenUri == null || tokenUri.isBlank()) {
            tokenUri = "https://oauth2.googleapis.com/token";
        }
        if (jwkSetUri == null || jwkSetUri.isBlank()) {
            jwkSetUri = "https://www.googleapis.com/oauth2/v3/certs";
        }
        if (issuers == null || issuers.isEmpty()) {
            issuers = List.of("https://accounts.google.com", "accounts.google.com");
        }
    }

    /** clientId が未設定なら Google ログインは無効とする。 */
    public boolean enabled() {
        return clientId != null && !clientId.isBlank();
    }
}
