import { NavLink, Outlet } from "react-router";
import { clsx } from "clsx";
import {
  Activity,
  Calendar,
  HeartPulse,
  Home,
  LogOut,
  Pill,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useAuth, useRequireAuth } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "ホーム", icon: Home, end: true },
  { to: "/medications", label: "お薬", icon: Pill, end: false },
  { to: "/health-logs", label: "体調", icon: Activity, end: false },
  { to: "/appointments", label: "通院", icon: Calendar, end: false },
  { to: "/settings", label: "設定", icon: Settings, end: false },
];

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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-400/10 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-ink-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
            <HeartPulse className="h-5 w-5" />
          </span>
          HealthFamily
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-500 transition hover:bg-ink-400/10 hover:text-ink-700"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </header>

      <main className="flex-1 px-4 py-6 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-2xl border-t border-ink-400/10 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
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
