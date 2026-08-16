import { Outlet } from "react-router";
import { useRequireAuth } from "@/lib/auth";
import { AppShell } from "@/widgets/app-shell";

/**
 * 認証済みルートのレイアウト。
 *
 * <p>認可のガードはここに置く。未認証・読み込み中は AppShell も配下の画面も
 * 一切描画せず、認証済みであることが確定してから初めて子を描く。
 * 判断を widget や page に散らすと、ガード漏れの画面が生まれるため。
 */
export default function AuthedLayout() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-500">
        読み込み中...
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
