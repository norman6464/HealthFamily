import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { api, ApiError } from "@/shared/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/shared/api";

const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

/**
 * Google Identity Services の公式ボタン。
 * 取得した ID トークンをバックエンドで検証し、自前 JWT に交換してログインする。
 * VITE_GOOGLE_CLIENT_ID 未設定時は何も表示しない。
 */
export function GoogleLoginButton({ onError }: { onError?: (message: string) => void }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const container = containerRef.current;
    const init = () => {
      const gsi = window.google?.accounts?.id;
      if (!gsi || !container.isConnected) return;
      gsi.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const data = await api.post<{ token: string; user: User }>(
              "/auth/google",
              { credential },
              false,
            );
            loginWithToken(data.token, data.user);
            navigate("/", { replace: true });
          } catch (err) {
            onError?.(err instanceof ApiError ? err.message : "Googleログインに失敗しました");
          }
        },
      });
      gsi.renderButton(container, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 300,
        locale: "ja",
      });
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", init, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-primary-100" aria-hidden />
        または
        <span className="h-px flex-1 bg-primary-100" aria-hidden />
      </div>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
