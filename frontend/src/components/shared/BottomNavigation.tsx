import React from 'react';
import { Link } from 'react-router-dom';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '🏠', label: 'ホーム' },
  { path: '/members', icon: '👥', label: 'メンバー' },
  { path: '/medications', icon: '💊', label: 'お薬' },
  { path: '/settings', icon: '👤', label: '設定' },
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
              <span className="text-lg" role="img" aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
