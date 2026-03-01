'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CharacterSelector } from '@/components/character/CharacterSelector';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { apiClient } from '@/data/api/apiClient';
import { signOut } from 'next-auth/react';
import { LogOut, Pencil, Check, X } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  characterType: string;
  characterName: string | null;
}

export default function Settings() {
  const { email } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiClient.get<UserProfile>('/users/me');
      setProfile(data);
      setDisplayName(data.displayName || '');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await apiClient.put<UserProfile>('/users/me', {
        displayName: displayName.trim(),
      });
      setProfile(updated);
      setIsEditingName(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || '');
    setIsEditingName(false);
  };

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
          <h2 className="text-lg font-semibold text-gray-800 mb-3">アカウント</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">メールアドレス</p>
              <p className="text-sm text-gray-700">{email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">表示名</p>
              {isEditingName ? (
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="表示名を入力"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSaving || !displayName.trim()}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                    aria-label="保存"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label="キャンセル"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-700">
                    {profile?.displayName || '未設定'}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="表示名を編集"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
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
