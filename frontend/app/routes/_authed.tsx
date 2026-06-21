import { NavLink, Outlet } from "react-router";
import { clsx } from "clsx";
import { CalendarCheck, Home, Pill, Users } from "lucide-react";
import { useAuth, useRequireAuth } from "@/lib/auth";

const navItems = [
  { to: "/", label: "ホーム", icon: Home, end: true },
  { to: "/members", label: "メンバー", icon: Users, end: false },
  { to: "/medications", label: "おくすり", icon: Pill, end: false },
];

export default function AuthedLayout() {
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <CalendarCheck className="h-5 w-5" />
          HealthFamily
        </div>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-700">
          ログアウト
        </button>
      </header>

      <main className="flex-1 px-4 py-5 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-2xl justify-around border-t border-slate-100 bg-white py-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-1 px-4 py-1 text-xs",
                isActive ? "text-primary" : "text-slate-400",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
