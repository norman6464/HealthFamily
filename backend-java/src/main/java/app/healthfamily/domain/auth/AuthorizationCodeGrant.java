package app.healthfamily.domain.auth;

import app.healthfamily.domain.shared.DomainException;

/**
 * 認可コードグラントで受け取った、トークン交換に必要な一式。
 *
 * <p>SPA は公開クライアントで client_secret を安全に保持できないため、
 * <b>PKCE の code_verifier を必須</b>にしている（RFC 7636）。
 * 認可コードを盗まれても、合言葉の本体を知らない攻撃者はトークンを取得できない。
 *
 * <p>従来の Google Identity Services は ID トークンをブラウザへ直接渡す方式で、
 * 実質インプリシットに近い。認可コードグラントへ移す目的はここにある。
 *
 * @param code 認可サーバーが発行した認可コード。一度しか使えない
 * @param codeVerifier 認可リクエスト時に作った合言葉の本体（43〜128 文字）
 * @param redirectUri 認可リクエストと完全一致していなければならない
 */
public record AuthorizationCodeGrant(String code, String codeVerifier, String redirectUri) {

    private static final int VERIFIER_MIN = 43;
    private static final int VERIFIER_MAX = 128;

    public AuthorizationCodeGrant {
        if (code == null || code.isBlank()) {
            throw DomainException.validation("認可コードは必須です");
        }
        if (codeVerifier == null || codeVerifier.isBlank()) {
            throw DomainException.validation("code_verifier は必須です");
        }
        if (codeVerifier.length() < VERIFIER_MIN || codeVerifier.length() > VERIFIER_MAX) {
            throw DomainException.validation(
                    "code_verifier は %d〜%d 文字である必要があります".formatted(VERIFIER_MIN, VERIFIER_MAX));
        }
        if (!codeVerifier.matches("[A-Za-z0-9\\-._~]+")) {
            throw DomainException.validation(
                    "code_verifier に使用できない文字が含まれています");
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            throw DomainException.validation("redirect_uri は必須です");
        }
    }
}
