package app.healthfamily.infrastructure.auth;

import app.healthfamily.domain.auth.AccessTokenIssuer;
import app.healthfamily.domain.auth.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 自アプリのアクセストークンを HS256 で発行する。
 *
 * <p>クレームの形と有効期限は Go 版と一致させてある（uid / email / sub、7 日）。
 * 移行中は両方のバックエンドが同じトークンを受け付けられる必要があるため。
 */
@Component
public class HmacAccessTokenIssuer implements AccessTokenIssuer {

    /** Go 版の main.go と同じ 7 日 */
    static final Duration TTL = Duration.ofDays(7);

    private final byte[] secret;

    public HmacAccessTokenIssuer(@Value("${healthfamily.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            // HS256 の鍵はハッシュ出力長 (256bit) 以上が必要 (RFC 7518)
            throw new IllegalStateException(
                    "healthfamily.jwt.secret は 32 バイト以上である必要があります");
        }
        this.secret = bytes;
    }

    @Override
    public String issue(User user, Instant now) {
        var claims =
                new JWTClaimsSet.Builder()
                        .subject(user.id())
                        .claim("uid", user.id())
                        .claim("email", user.email())
                        .issueTime(Date.from(now))
                        .expirationTime(Date.from(now.plus(TTL)))
                        .build();
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        try {
            jwt.sign(new MACSigner(secret));
        } catch (JOSEException e) {
            throw new IllegalStateException("アクセストークンの署名に失敗しました", e);
        }
        return jwt.serialize();
    }
}
