import React, { useState } from "react";
import type { Appointment, Hospital, Member } from "@/shared/api";
import { MemberIcon, type MemberType, type PetType } from "@/shared/ui";

export interface AppointmentFormData {
  memberId: string;
  hospitalId?: string;
  appointmentDate: string;
  type?: string;
  notes?: string;
}

interface AppointmentFormProps {
  members: Member[];
  hospitals: Hospital[];
  onSubmit: (data: AppointmentFormData) => void;
  initialData?: Appointment;
  onCancel?: () => void;
}

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  checkup: "定期検診",
  treatment: "治療",
  vaccination: "予防接種",
  surgery: "手術",
  consultation: "相談",
  medication_pickup: "お薬",
  examination: "検査",
  flea_tick: "ノミ・ダニ薬",
  heartworm: "フィラリア",
  therapeutic_diet: "療養食",
  grooming: "トリミング",
  other: "その他",
};

const formatDateForInput = (date: string): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  members,
  hospitals,
  onSubmit,
  initialData,
  onCancel,
}) => {
  const isEditing = !!initialData;
  const [memberId, setMemberId] = useState(initialData?.memberId || members[0]?.id || "");
  const [hospitalId, setHospitalId] = useState(initialData?.hospitalId || "");
  const [appointmentDate, setAppointmentDate] = useState(
    initialData ? formatDateForInput(initialData.appointmentDate) : "",
  );
  const [type, setType] = useState(initialData?.appointmentType || "");
  const [notes, setNotes] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !appointmentDate) return;

    onSubmit({
      memberId,
      hospitalId: hospitalId || undefined,
      appointmentDate,
      type: type || undefined,
      notes: notes.trim() || undefined,
    });

    if (!isEditing) {
      setAppointmentDate("");
      setType("");
      setNotes("");
    }
  };

  const typeOptions = Object.entries(APPOINTMENT_TYPE_LABELS);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="apt-member" className="block text-sm font-medium text-ink-700 mb-1">
          メンバー
        </label>
        <div className="space-y-1">
          {members.map((m) => {
            const isSelected = memberId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMemberId(m.id)}
                disabled={isEditing}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "border-primary-500 bg-primary-50"
                    : "border-primary-100 hover:bg-primary-50"
                } ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <MemberIcon
                  memberType={m.memberType as MemberType}
                  petType={(m.petType as PetType | null) ?? undefined}
                  size={16}
                  className="text-ink-600"
                />
                <span className="text-sm">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="apt-date" className="block text-sm font-medium text-ink-700 mb-1">
          予約日
        </label>
        <input
          id="apt-date"
          type="date"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      {hospitals.length > 0 && (
        <div>
          <label htmlFor="apt-hospital" className="block text-sm font-medium text-ink-700 mb-1">
            病院（任意）
          </label>
          <select
            id="apt-hospital"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">選択しない</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="apt-type" className="block text-sm font-medium text-ink-700 mb-1">
          種別（任意）
        </label>
        <select
          id="apt-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">選択しない</option>
          {typeOptions.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="apt-notes" className="block text-sm font-medium text-ink-700 mb-1">
          {type === "vaccination" ? "ワクチン名" : "メモ"}（任意）
        </label>
        <textarea
          id="apt-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder={type === "vaccination" ? "例: 混合ワクチン, 狂犬病ワクチン" : "メモを入力"}
        />
      </div>

      <div className={isEditing ? "flex space-x-2" : ""}>
        <button
          type="submit"
          className={`${isEditing ? "flex-1" : "w-full"} bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium`}
        >
          {isEditing ? "更新する" : "追加する"}
        </button>
        {isEditing && onCancel && (
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
