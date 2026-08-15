package app.healthfamily.auth.domain;

import java.time.Instant;

/**
 * 自アプリのアクセストークンを発行するポート。
 *
 * <p>Google から受け取ったトークンをそのまま API 認証に使い回さない。
 * ID トークンは「ログインしたのが誰か」を伝えるためのもので、
 * リソースアクセスの権限を表すものではないため。
 */
public interface AccessTokenIssuer {

    String issue(User user, Instant now);
}
