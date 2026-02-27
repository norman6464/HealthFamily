import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Pill, Settings, type LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'ホーム' },
  { path: '/members', icon: Users, label: 'メンバー' },
  { path: '/medications', icon: Pill, label: 'お薬' },
  { path: '/settings', icon: Settings, label: '設定' },
];

interface BottomNavigationProps {
  activePath: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activePath }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" aria-label="メインナビゲーション">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map(({ path, icon, label }) => {
          const isActive = activePath === path;
          return (
            <Link
              key={path}
              to={path}
              {...(isActive && { 'aria-current': 'page' as const })}
              className={`flex flex-col items-center text-xs ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              {React.createElement(icon, { size: 20, className: 'mb-0.5' })}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
