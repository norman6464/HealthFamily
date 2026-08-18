import { useState } from "react";
import { useMembers } from "@/entities/member";
import { EmergencyContactCreateForm, useDeleteEmergencyContact, useUpdateEmergencyContact } from "@/features/manage-emergency-contacts";
import { Link, useNavigate } from "react-router";
import { LogOut, X, Plus, Phone, Bell, ChevronRight, HelpCircle } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useUserProfile } from "@/entities/user";
import {
  EmergencyContactList,
  useEmergencyContacts,
  type EmergencyContactWithMember,
  type UpdateEmergencyContactInput,
} from "@/entities/emergency-contact";
import { CharacterSelector } from "@/features/select-character";
import { DisplayNameEditor } from "@/features/update-user-profile";
import { SectionTitle } from "@/shared/ui";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data: profile } = useUserProfile();

  const { data: members = [], isLoading: membersLoading } = useMembers();

  const { data: contacts = [], isLoading: contactsLoading } = useEmergencyContacts();

  const [showContactForm, setShowContactForm] = useState(false);

  const updateContactMutation = useUpdateEmergencyContact();
  const deleteContactMutation = useDeleteEmergencyContact();

  const contactsWithMember: EmergencyContactWithMember[] = contacts.map((c) => ({
    ...c,
    memberName: members.find((m) => m.id === c.memberId)?.name,
  }));

  const handleUpdateContact = async (id: string, input: UpdateEmergencyContactInput) => {
    await updateContactMutation.mutateAsync({ id, input });
  };

  const handleDeleteContact = (id: string) => {
    if (!window.confirm("この緊急連絡先を削除しますか？")) return;
    deleteContactMutation.mutate(id);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink-800">設定</h1>

      <section className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
        <SectionTitle accentColor="primary" size="lg">
          アカウント
        </SectionTitle>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-ink-400">メールアドレス</p>
            <p className="text-sm text-ink-700">{user?.email}</p>
          </div>
          <DisplayNameEditor profile={profile} />
        </div>
      </section>

      <Link
        to="/settings/notifications"
        className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-primary-100 hover:bg-primary-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Bell size={20} className="text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-ink-800">通知設定</p>
            <p className="text-xs text-ink-500">リマインダーやアラートの設定</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-ink-400" />
      </Link>

      <Link
        to="/guide"
        className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-primary-100 hover:bg-primary-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <HelpCircle size={20} className="text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-ink-800">使い方ガイド</p>
            <p className="text-xs text-ink-500">アプリの基本的な使い方を確認</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-ink-400" />
      </Link>

      <section className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
        <h2 className="text-lg font-semibold text-ink-800 mb-4">キャラクター選択</h2>
        <CharacterSelector />
      </section>

      <section className="bg-white rounded-lg shadow-md p-4 border border-primary-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Phone size={18} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-ink-800">緊急連絡先</h2>
          </div>
          <button
            onClick={() => setShowContactForm(!showContactForm)}
            className="bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors"
            aria-label={showContactForm ? "閉じる" : "緊急連絡先を追加"}
          >
            {showContactForm ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {showContactForm && !membersLoading && members.length > 0 && (
          <div className="mb-4 bg-primary-50/50 rounded-lg p-4 border border-primary-100">
            <h3 className="text-sm font-semibold text-ink-700 mb-3">緊急連絡先の追加</h3>
            <EmergencyContactCreateForm
              members={members}
              onCreated={() => setShowContactForm(false)}
              onCancel={() => setShowContactForm(false)}
            />
          </div>
        )}

        {showContactForm && !membersLoading && members.length === 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            先に
            <Link to="/members" className="underline font-medium text-yellow-800 hover:text-yellow-900">
              メンバーページ
            </Link>
            でメンバーを登録してください。
          </div>
        )}

        <EmergencyContactList
          contacts={contactsWithMember}
          isLoading={contactsLoading}
          onUpdate={handleUpdateContact}
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
    </div>
  );
}
