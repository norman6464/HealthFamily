import { createCodeChallenge, createRandomString } from "@/shared/lib/pkce";

/**
 * Google の認可コードグラント（+ PKCE）の開始とコールバック検証。
 *
 * <p>従来の Google Identity Services は ID トークンをブラウザへ直接渡す方式で、
 * 実質インプリシットに近い。ここでは認可コードだけを受け取り、
 * トークン交換はバックエンドがサーバー間通信で行う。
 */

export const GOOGLE_AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

/** 合言葉の置き場。タブを閉じれば消えるよう sessionStorage を使う */
const STORAGE_KEY = "hf_oauth_pending";

/** code_verifier は仕様上の最大長を使う。短くする理由が無い */
const VERIFIER_LENGTH = 128;

interface PendingAuthorization {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface AuthorizationRequest {
  url: string;
  state: string;
}

/**
 * 認可リクエストを組み立て、合言葉を保存する。
 *
 * @param redirectUri 認可サーバーからの戻り先。自分のオリジンでなければ拒否する
 */
export async function buildAuthorizationRequest(
  clientId: string,
  redirectUri: string,
): Promise<AuthorizationRequest> {
  requireSameOrigin(redirectUri);

  const codeVerifier = createRandomString(VERIFIER_LENGTH);
  const state = createRandomString(43);
  const nonce = createRandomString(43);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  const pending: PendingAuthorization = { state, nonce, codeVerifier, redirectUri };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    // 毎回アカウント選択を出す。共有端末で前回の利用者のまま入るのを防ぐ
    prompt: "select_account",
  });

  return { url: `${GOOGLE_AUTHORIZE_ENDPOINT}?${params.toString()}`, state };
}

/**
 * コールバックで受け取った state を検証し、合言葉を取り出す。
 *
 * <p>取り出したら即座に消す。認可コードは 1 度しか使えないので、
 * 合言葉を残しておく理由が無いうえ、残すと再送で悪用される余地ができる。
 *
 * @throws state が一致しない、または開始記録が無い場合
 */
export function consumeAuthorizationState(state: string): PendingAuthorization {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    throw new Error("ログインの開始記録が見つかりません。もう一度お試しください");
  }
  // 検証の成否にかかわらず消す。失敗した合言葉を再利用させない
  sessionStorage.removeItem(STORAGE_KEY);

  let pending: PendingAuthorization;
  try {
    pending = JSON.parse(raw) as PendingAuthorization;
  } catch {
    throw new Error("ログインの開始記録が壊れています。もう一度お試しください");
  }

  if (!pending.state || pending.state !== state) {
    throw new Error("state が一致しません。ログインをやり直してください");
  }
  return pending;
}

/** 認可サーバーからの戻り先が自分のオリジンであることを確かめる。 */
function requireSameOrigin(redirectUri: string): void {
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new Error("リダイレクト先が正しくありません");
  }
  if (parsed.origin !== location.origin) {
    throw new Error("リダイレクト先が自分のオリジンと一致しません");
  }
}
