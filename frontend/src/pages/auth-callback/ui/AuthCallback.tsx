import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api, ApiError } from "@/shared/api";
import type { User } from "@/shared/api";
import { consumeAuthorizationState, useAuth } from "@/features/auth";

/**
 * Google からの戻り先。
 *
 * <p>受け取るのは認可コードだけ。state を検証してから、コードと合言葉を
 * バックエンドへ渡す。トークン交換はサーバー間通信で行われるので、
 * ID トークンはブラウザに一切渡らない。
 */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // 認可コードは1度しか使えない。開発時の二重実行で無駄に消費しないようにする
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const denied = params.get("error");
      if (denied) {
        // 利用者が同意しなかった場合。認可サーバーの生の文言は出さない
        setError("Googleログインがキャンセルされました");
        return;
      }

      const code = params.get("code");
      const state = params.get("state");
      if (!code || !state) {
        setError("Googleからの応答が不正です");
        return;
      }

      try {
        const pending = consumeAuthorizationState(state);
        const data = await api.post<{ token: string; user: User }>(
          "/auth/google/callback",
          { code, codeVerifier: pending.codeVerifier, redirectUri: pending.redirectUri },
          false,
        );
        loginWithToken(data.token, data.user);
        navigate("/", { replace: true });
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Googleログインに失敗しました",
        );
      }
    };
    void run();
  }, [params, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          ログイン画面へ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-ink-500">
      ログインしています...
    </div>
  );
}
