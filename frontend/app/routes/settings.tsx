import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { LogOut, Pencil, Check, X, Plus, Phone, Bell, ChevronRight, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User, Member, EmergencyContact } from "@/lib/types";
import { CharacterSelector } from "@/components/character/CharacterSelector";
import {
  EmergencyContactForm,
  type EmergencyContactFormData,
} from "@/components/emergency-contacts/EmergencyContactForm";
import {
  EmergencyContactList,
  type EmergencyContactWithMember,
  type UpdateEmergencyContactInput,
} from "@/components/emergency-contacts/EmergencyContactList";
import { SectionTitle } from "@/components/shared/SectionTitle";

export default function Settings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => api.get<User>("/users/me"),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: () => api.get<EmergencyContact[]>("/emergency-contacts"),
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (input: { displayName: string }) => api.patch<User>("/users/me", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "me"] }),
  });

  const createContactMutation = useMutation({
    mutationFn: (data: EmergencyContactFormData) =>
      api.post<EmergencyContact>("/emergency-contacts", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency-contacts"] }),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmergencyContactInput }) =>
      api.patch<EmergencyContact>(`/emergency-contacts/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency-contacts"] }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/emergency-contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency-contacts"] }),
  });

  const contactsWithMember: EmergencyContactWithMember[] = contacts.map((c) => ({
    ...c,
    memberName: members.find((m) => m.id === c.memberId)?.name,
  }));

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    await updateProfileMutation.mutateAsync({ displayName: displayName.trim() });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || "");
    setIsEditingName(false);
  };

  const handleCreateContact = async (data: EmergencyContactFormData) => {
    await createContactMutation.mutateAsync(data);
    setShowContactForm(false);
  };

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
          <div>
            <p className="text-xs text-ink-400">表示名</p>
            {isEditingName ? (
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="表示名を入力"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={updateProfileMutation.isPending || !displayName.trim()}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                  aria-label="保存"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 text-ink-400 hover:bg-primary-50 rounded-md transition-colors"
                  aria-label="キャンセル"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <p className="text-sm text-ink-700">{profile?.displayName || "未設定"}</p>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-ink-400 hover:text-ink-600 transition-colors"
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
            <EmergencyContactForm
              members={members}
              onSubmit={handleCreateContact}
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
