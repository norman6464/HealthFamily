import { NavLink, Outlet } from "react-router";
import { clsx } from "clsx";
import {
  Activity,
  Building2,
  Calendar,
  HeartPulse,
  History,
  Home,
  LogOut,
  Pill,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth, useRequireAuth } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

// サイドバー(PC)はフル項目、ボトムナビ(スマホ)は主要5項目
const navItems: NavItem[] = [
  { to: "/", label: "ホーム", icon: Home, end: true },
  { to: "/members", label: "メンバー", icon: Users, end: false },
  { to: "/medications", label: "お薬", icon: Pill, end: false },
  { to: "/health-logs", label: "体調", icon: Activity, end: false },
  { to: "/appointments", label: "通院", icon: Calendar, end: false },
  { to: "/hospitals", label: "病院", icon: Building2, end: false },
  { to: "/expenses", label: "医療費", icon: Wallet, end: false },
  { to: "/history", label: "履歴", icon: History, end: false },
  { to: "/settings", label: "設定", icon: Settings, end: false },
];

const bottomNavItems = navItems.filter((n) =>
  ["/", "/medications", "/health-logs", "/appointments", "/settings"].includes(n.to),
);

function Brand() {
  return (
    <div className="flex items-center gap-2 font-bold text-ink-800">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
        <HeartPulse className="h-5 w-5" />
      </span>
      HealthFamily
    </div>
  );
}

export default function AuthedLayout() {
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      {/* ===== PC: 左サイドバー ===== */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-ink-400/10 bg-white px-4 py-5 md:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-primary-50 text-primary"
                    : "text-ink-600 hover:bg-ink-400/5 hover:text-ink-800",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-400/5 hover:text-ink-700"
        >
          <LogOut className="h-5 w-5" />
          ログアウト
        </button>
      </aside>

      {/* ===== コンテンツ ===== */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        {/* スマホ: ヘッダー */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-400/10 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Brand />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-500 transition hover:bg-ink-400/10 hover:text-ink-700"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28 md:max-w-5xl md:px-8 md:py-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* ===== スマホ: ボトムナビ ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-2xl border-t border-ink-400/10 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="flex justify-around py-2">
          {bottomNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition",
                  isActive ? "text-primary" : "text-ink-400 hover:text-ink-600",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      "flex h-9 w-12 items-center justify-center rounded-full transition",
                      isActive && "bg-primary-50",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
