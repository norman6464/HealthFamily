import React from "react";
import { NavLink } from "react-router";
import { Home, Pill, Calendar, Activity, Settings, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  end: boolean;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, label: "ホーム", end: true },
  { path: "/medications", icon: Pill, label: "お薬", end: false },
  { path: "/health-logs", icon: Activity, label: "体調", end: false },
  { path: "/appointments", icon: Calendar, label: "通院", end: false },
  { path: "/settings", icon: Settings, label: "設定", end: false },
];

// スマホ専用の下部タブバー。PC(md以上)はサイドバーがあるため表示しない。
export const BottomNavigation: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary-100 bg-white shadow-lg md:hidden"
      aria-label="メインナビゲーション"
    >
      <div className="mx-auto flex max-w-md justify-around py-2">
        {navItems.map(({ path, icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center text-xs transition-colors",
                isActive ? "font-semibold text-primary-700" : "text-ink-400 hover:text-primary-600",
              )
            }
          >
            {React.createElement(icon, { size: 20, className: "mb-0.5" })}
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
