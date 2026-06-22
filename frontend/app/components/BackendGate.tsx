import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, ServerCrash } from "lucide-react";
import { pingHealth } from "@/lib/api";

type Status = "checking" | "ready" | "down";

// コールドスタート(~50秒)をカバーするためのリトライ上限
const MAX_TOTAL_MS = 80_000;
const RETRY_DELAY_MS = 3_000;
const SLOW_HINT_MS = 4_000;

/**
 * アプリ起動時にバックエンドの /health を確認するゲート。
 * - 応答するまで「起動中」画面を表示しつつリトライ(コールドスタート中も待機)
 * - 一定時間応答が無ければ「メンテナンス」画面＋再試行ボタン
 * - 応答が得られたら子(アプリ本体)を描画
 * ユーザーアクセス自体がバックエンドのウォームアップを兼ねる。
 */
export function BackendGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [slow, setSlow] = useState(false);
  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    const myRun = ++runIdRef.current;
    setStatus("checking");
    setSlow(false);
    const start = Date.now();
    const slowTimer = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    try {
      while (runIdRef.current === myRun) {
        const ok = await pingHealth();
        if (runIdRef.current !== myRun) return;
        if (ok) {
          setStatus("ready");
          return;
        }
        if (Date.now() - start > MAX_TOTAL_MS) {
          setStatus("down");
          return;
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    } finally {
      clearTimeout(slowTimer);
    }
  }, []);

  useEffect(() => {
    run();
    return () => {
      // アンマウント時に進行中ループを無効化
      runIdRef.current++;
    };
  }, [run]);

  if (status === "ready") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-primary-100 bg-white p-8 text-center shadow-sm">
        {status === "checking" ? (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <h1 className="mb-2 text-lg font-semibold text-ink-800">起動中です</h1>
            <p className="text-sm text-ink-500">
              {slow
                ? "サーバーを起動しています。初回は1分ほどかかる場合があります…"
                : "サーバーに接続しています…"}
            </p>
          </>
        ) : (
          <>
            <ServerCrash className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h1 className="mb-2 text-lg font-semibold text-ink-800">ただいまメンテナンス中です</h1>
            <p className="mb-6 text-sm text-ink-500">
              サーバーに接続できませんでした。しばらくしてから再度お試しください。
            </p>
            <button
              onClick={run}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              再試行する
            </button>
          </>
        )}
      </div>
    </div>
  );
}
