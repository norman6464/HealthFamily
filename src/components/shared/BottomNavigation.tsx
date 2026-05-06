import React from 'react';
import Link from 'next/link';
import { Home, Pill, Calendar, Activity, Settings, type LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'ホーム' },
  { path: '/medications', icon: Pill, label: 'お薬' },
  { path: '/health-logs', icon: Activity, label: '体調' },
  { path: '/appointments', icon: Calendar, label: '通院' },
  { path: '/settings', icon: Settings, label: '設定' },
];

interface BottomNavigationProps {
  activePath: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activePath }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-soft-lg" aria-label="メインナビゲーション">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map(({ path, icon, label }) => {
          const isActive = activePath === path;
          return (
            <Link
              key={path}
              href={path}
              {...(isActive && { 'aria-current': 'page' as const })}
              className={`flex flex-col items-center text-xs transition-colors ${
                isActive ? 'text-navy-700 font-semibold' : 'text-gray-400 hover:text-navy-600'
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
