'use client';

import { useAuth } from '@/hooks/useAuth';
import { CharacterSelector } from '@/components/character/CharacterSelector';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function Settings() {
  const { email } = useAuth();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-primary-600">設定</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        <section className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">アカウント</h2>
          <p className="text-sm text-gray-600">{email}</p>
        </section>

        <section className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">キャラクター選択</h2>
          <CharacterSelector />
        </section>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-white text-red-600 border border-red-200 rounded-lg py-3 px-4 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>ログアウト</span>
        </button>
      </main>

      <BottomNavigation activePath="/settings" />
    </div>
  );
}
