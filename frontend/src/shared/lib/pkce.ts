/**
 * PKCE（Proof Key for Code Exchange, RFC 7636）の合言葉まわり。
 *
 * SPA は公開クライアントで client_secret を安全に持てない。認可コードだけを盗まれても
 * トークンを取得されないよう、毎回ランダムな合言葉を作り、そのハッシュを先に
 * 認可サーバーへ預けておく。
 */

/** RFC 7636 が code_verifier に許す文字 */
const UNRESERVED = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

const MIN_LENGTH = 43;
const MAX_LENGTH = 128;

/**
 * 暗号論的に安全なランダム文字列を作る。
 *
 * <p>Math.random は使わない。予測可能な合言葉は PKCE の意味を無くす。
 */
export function createRandomString(length: number): string {
  if (length < MIN_LENGTH || length > MAX_LENGTH) {
    throw new Error(`長さは ${MIN_LENGTH}〜${MAX_LENGTH} の範囲で指定してください`);
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  // 剰余を取るとわずかに偏るが、UNRESERVED は 66 文字で 256 に対する偏りは
  // 合言葉の総当たり耐性に影響しない程度に小さい。
  let result = "";
  for (const byte of bytes) {
    result += UNRESERVED[byte % UNRESERVED.length];
  }
  return result;
}

/**
 * code_challenge を作る。方式は常に S256。
 *
 * <p>plain（ハッシュ化しない）は仕様上選べるが、盗まれた時点で意味がなくなるので使わない。
 */
export async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return base64UrlEncode(new Uint8Array(digest));
}

/** Base64URL（+ / = を含まない形）へ変換する。 */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
