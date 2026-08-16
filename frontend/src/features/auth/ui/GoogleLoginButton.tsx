import { useState } from "react";
import { buildAuthorizationRequest } from "../model/googleOauth";

/** 認可サーバーからの戻り先。Google Cloud Console にも同じ値の登録が必要 */
export const GOOGLE_CALLBACK_PATH = "/auth/callback";

/**
 * Google ログインの開始ボタン。
 *
 * <p>認可コードグラント + PKCE でリダイレクトする。ブラウザが受け取るのは認可コードだけで、
 * ID トークンも client_secret も JavaScript からは触れない。
 * 従来の Google Identity Services は ID トークンをブラウザへ直接渡す方式だった。
 *
 * <p>VITE_GOOGLE_CLIENT_ID 未設定時は何も表示しない。
 */
export function GoogleLoginButton({ onError }: { onError?: (message: string) => void }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [starting, setStarting] = useState(false);

  if (!clientId) return null;

  const start = async () => {
    setStarting(true);
    try {
      const { url } = await buildAuthorizationRequest(
        clientId,
        `${location.origin}${GOOGLE_CALLBACK_PATH}`,
      );
      // replace にして、戻るボタンで認可前の状態に戻らないようにする
      location.replace(url);
    } catch (err) {
      setStarting(false);
      onError?.(err instanceof Error ? err.message : "Googleログインを開始できませんでした");
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={starting}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-400/20 bg-white px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-ink-400/5 disabled:opacity-60"
    >
      <GoogleMark />
      {starting ? "Googleへ移動しています..." : "Googleでログイン"}
    </button>
  );
}

/** Google のブランドマーク */
function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
      />
    </svg>
  );
}
