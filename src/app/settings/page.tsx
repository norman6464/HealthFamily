'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/presentation/hooks/useUserProfile';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useEmergencyContacts } from '@/presentation/hooks/useEmergencyContacts';
import { CharacterSelector } from '@/components/character/CharacterSelector';
import { EmergencyContactForm, EmergencyContactFormData } from '@/components/emergency-contacts/EmergencyContactForm';
import { EmergencyContactList } from '@/components/emergency-contacts/EmergencyContactList';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Pencil, Check, X, Plus, Phone, Bell, ChevronRight } from 'lucide-react';

export default function Settings() {
  const { email, userId, isLoading: authLoading } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { members, isLoading: membersLoading } = useMembers(userId ?? '');
  const { contacts, isLoading: contactsLoading, createContact, updateContact, deleteContact } = useEmergencyContacts();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
    }
  }, [profile]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
      setIsEditingName(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || '');
    setIsEditingName(false);
  };

  const handleCreateContact = async (data: EmergencyContactFormData) => {
    await createContact(data);
    setShowContactForm(false);
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('この緊急連絡先を削除しますか？')) return;
    await deleteContact(id);
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

        <Link
          href="/settings/notifications"
          className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Bell size={20} className="text-primary-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">通知設定</p>
              <p className="text-xs text-gray-500">リマインダーやアラートの設定</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>

        <section className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">キャラクター選択</h2>
          <CharacterSelector />
        </section>

        <section className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Phone size={18} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-800">緊急連絡先</h2>
            </div>
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
              aria-label={showContactForm ? '閉じる' : '緊急連絡先を追加'}
            >
              {showContactForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showContactForm && !authLoading && !membersLoading && members.length > 0 && (
            <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">緊急連絡先の追加</h3>
              <EmergencyContactForm
                members={members}
                onSubmit={handleCreateContact}
                onCancel={() => setShowContactForm(false)}
              />
            </div>
          )}

          {showContactForm && !authLoading && !membersLoading && members.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
              先に<Link href="/members" className="underline font-medium text-yellow-800 hover:text-yellow-900">メンバーページ</Link>でメンバーを登録してください。
            </div>
          )}

          <EmergencyContactList
            contacts={contacts}
            isLoading={contactsLoading}
            onUpdate={updateContact}
            onDelete={handleDeleteContact}
          />
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
