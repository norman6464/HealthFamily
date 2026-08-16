import { useState } from "react";
import { NavLink } from "react-router";
import { clsx } from "clsx";
import {
  Activity,
  BookOpen,
  Building2,
  Calendar,
  HeartPulse,
  History,
  Home,
  LogOut,
  Menu,
  Pill,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { BottomNavigation } from "@/shared/ui";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

// 全機能の一覧（PCサイドバー / モバイルのハンバーガーメニューで使用）
const navItems: NavItem[] = [
  { to: "/", label: "ホーム", icon: Home, end: true },
  { to: "/members", label: "メンバー", icon: Users, end: false },
  { to: "/medications", label: "お薬", icon: Pill, end: false },
  { to: "/health-logs", label: "体調", icon: Activity, end: false },
  { to: "/appointments", label: "通院", icon: Calendar, end: false },
  { to: "/hospitals", label: "病院", icon: Building2, end: false },
  { to: "/expenses", label: "医療費・家計", icon: Wallet, end: false },
  { to: "/history", label: "履歴", icon: History, end: false },
  { to: "/settings", label: "設定", icon: Settings, end: false },
  { to: "/guide", label: "使い方ガイド", icon: BookOpen, end: false },
];

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

function SidebarNavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const { to, label, icon: Icon, end } = item;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
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
  );
}

/**
 * 認証済み画面の外枠。サイドバー・ヘッダー・下部タブを提供する。
 *
 * 認可の判断はここでは行わない。ガードは app 層のルートモジュールが担い、
 * この widget は「認証済みであることが確定した後」にのみ描画される。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* ===== PC: 左サイドバー ===== */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-ink-400/10 bg-white px-4 py-5 md:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarNavLink key={item.to} item={item} />
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
        {/* スマホ: ヘッダー(ハンバーガー + ブランド) */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-400/10 bg-white/80 px-3 py-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-400/10"
            aria-label="メニューを開く"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Brand />
          <span className="w-9" aria-hidden />
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-24 md:max-w-5xl md:px-8 md:py-8">
          {children}
        </main>
      </div>

      {/* ===== スマホ: 下部タブバー (全ページ共通、PCはサイドバーのため非表示) ===== */}
      <BottomNavigation />

      {/* ===== スマホ: ハンバーガーメニュー(ドロワー) ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink-800/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white px-4 py-5 shadow-card">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-400/10"
                aria-label="メニューを閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
              {navItems.map((item) => (
                <SidebarNavLink key={item.to} item={item} onClick={() => setMenuOpen(false)} />
              ))}
            </nav>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-400/5 hover:text-ink-700"
            >
              <LogOut className="h-5 w-5" />
              ログアウト
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
