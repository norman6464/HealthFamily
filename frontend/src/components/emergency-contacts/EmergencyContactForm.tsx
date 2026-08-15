import React, { useState } from "react";
import type { Member } from "@/lib/types";

export interface EmergencyContactFormData {
  memberId: string;
  contactName: string;
  phoneNumber: string;
  relationship?: string;
  notes?: string;
}

interface EmergencyContactFormProps {
  members: Member[];
  onSubmit: (data: EmergencyContactFormData) => void;
  onCancel?: () => void;
  initialData?: {
    memberId: string;
    contactName: string;
    phoneNumber: string;
    relationship?: string;
    notes?: string;
  };
}

const RELATIONSHIP_OPTIONS = ["父", "母", "配偶者", "兄弟姉妹", "祖父母", "子", "かかりつけ医", "友人", "職場"];

export const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({
  members,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [memberId, setMemberId] = useState(
    initialData?.memberId || (members.length === 1 ? members[0].id : ""),
  );
  const [contactName, setContactName] = useState(initialData?.contactName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [relationship, setRelationship] = useState(initialData?.relationship || "");
  const [showCustomRelationship, setShowCustomRelationship] = useState(
    !!initialData?.relationship && !RELATIONSHIP_OPTIONS.includes(initialData.relationship),
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !contactName.trim() || !phoneNumber.trim()) return;

    onSubmit({
      memberId,
      contactName: contactName.trim(),
      phoneNumber: phoneNumber.trim(),
      relationship: relationship.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!initialData) {
      setContactName("");
      setPhoneNumber("");
      setRelationship("");
      setNotes("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ec-member" className="block text-sm font-medium text-ink-700 mb-1">
          メンバー
        </label>
        <select
          id="ec-member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        >
          <option value="">選択してください</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ec-name" className="block text-sm font-medium text-ink-700 mb-1">
          連絡先名
        </label>
        <input
          id="ec-name"
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
          placeholder="例: 田中花子"
        />
      </div>

      <div>
        <label htmlFor="ec-phone" className="block text-sm font-medium text-ink-700 mb-1">
          電話番号
        </label>
        <input
          id="ec-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
          placeholder="例: 090-1234-5678"
        />
      </div>

      <div>
        <label htmlFor="ec-relationship" className="block text-sm font-medium text-ink-700 mb-1">
          続柄（任意）
        </label>
        <select
          id="ec-relationship"
          value={RELATIONSHIP_OPTIONS.includes(relationship) ? relationship : relationship ? "other" : ""}
          onChange={(e) => {
            if (e.target.value === "other") {
              setRelationship("");
              setShowCustomRelationship(true);
            } else {
              setRelationship(e.target.value);
              setShowCustomRelationship(false);
            }
          }}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">選択してください</option>
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="other">その他（自由入力）</option>
        </select>
        {showCustomRelationship && (
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="続柄を入力してください"
          />
        )}
      </div>

      <div>
        <label htmlFor="ec-notes" className="block text-sm font-medium text-ink-700 mb-1">
          メモ（任意）
        </label>
        <textarea
          id="ec-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder="日中連絡可、夜間のみ等"
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          {initialData ? "更新する" : "登録する"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-primary-100 text-ink-700 py-2 px-4 rounded-lg hover:bg-primary-200 transition-colors font-medium"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
