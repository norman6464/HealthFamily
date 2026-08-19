import { api } from "@/shared/api";
import type { User } from "@/shared/api";

/**
 * 認証まわりの操作。
 *
 * いずれも第3引数に false を渡し、Authorization ヘッダを付けない。
 * ログイン前に叩く経路なので、期限切れのトークンが残っていると
 * それを送って 401 になり、トークンが破棄されてしまう。
 *
 * ページから直接 api を叩かず、ここに集約する。エンドポイントの綴りや
 * 認証ヘッダの有無といった約束が画面ごとにばらけると、
 * 片方だけ直し忘れる形で壊れる。
 */

export function signUp(input: { email: string; password: string; displayName?: string }) {
  return api.post("/auth/signup", input, false);
}

export function verifyEmail(input: { email: string; code: string }) {
  return api.post<{ token: string; user: User }>("/auth/verify", input, false);
}

export function resendVerificationCode(email: string) {
  return api.post("/auth/resend-code", { email }, false);
}

export function requestPasswordReset(email: string) {
  return api.post("/auth/forgot-password", { email }, false);
}

export function resetPassword(input: { email: string; code: string; newPassword: string }) {
  return api.post("/auth/reset-password", input, false);
}

/**
 * Google の認可コードをトークンに交換する。
 *
 * 交換はサーバー側で行われる。ブラウザが渡すのは一度きりの認可コードと
 * PKCE の合言葉だけで、ID トークンもリフレッシュトークンも受け取らない。
 */
export function exchangeGoogleAuthorizationCode(input: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  return api.post<{ token: string; user: User }>("/auth/google/callback", input, false);
}
