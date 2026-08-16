package app.healthfamily.domain.auth;

/**
 * 認可コードを ID トークンに交換し、その中身を検証するポート。
 *
 * <p>ドメインは「交換して検証済みの本人情報が得られる」ことだけを知っていればよく、
 * HTTP も JWKS も知らない。テストでは差し替える。
 */
public interface GoogleTokenExchanger {

    /**
     * 認可コードを ID トークンに交換し、署名と各クレームを検証して本人情報を返す。
     *
     * @throws app.healthfamily.domain.shared.DomainException.Validation 交換または検証に失敗した場合
     */
    GoogleIdentity exchange(AuthorizationCodeGrant grant);
}
