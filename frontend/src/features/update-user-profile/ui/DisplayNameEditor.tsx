import React, { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import type { User } from "@/shared/api";
import { useUpdateUserProfile } from "../api/useUpdateUserProfile";

interface DisplayNameEditorProps {
  profile: User | undefined;
}

export const DisplayNameEditor: React.FC<DisplayNameEditorProps> = ({ profile }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const updateProfileMutation = useUpdateUserProfile();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
    }
  }, [profile]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    await updateProfileMutation.mutateAsync({ displayName: displayName.trim() });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || "");
    setIsEditingName(false);
  };

  return (
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
  );
};
