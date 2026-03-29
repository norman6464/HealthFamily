'use client';

import { useNotificationSettings } from '@/presentation/hooks/useNotificationSettings';
import { NotificationSettingsForm } from '@/components/notification-settings/NotificationSettingsForm';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotificationSettingsPage() {
  const { setting, isLoading, updateSetting } = useNotificationSettings();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center space-x-3">
          <Link
            href="/settings"
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="設定に戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-primary-600">通知設定</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <NotificationSettingsForm
          setting={setting}
          onSave={updateSetting}
          isLoading={isLoading}
        />
      </main>

      <BottomNavigation activePath="/settings" />
    </div>
  );
}
