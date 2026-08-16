import React, { useState } from "react";
import { ChevronDown, ChevronUp, ScanText } from "lucide-react";
import type { Medication } from "@/shared/api";
import type { MedicationCategory } from "@/shared/config";
import { OcrImport } from "./OcrImport";

export type { MedicationCategory };

export type MedicationStatus = "active" | "paused" | "discontinued";

export interface MedicationFormData {
  name: string;
  category: MedicationCategory;
  dosage: string;
  frequency: string;
  stockQuantity?: number;
  stockAlertDate?: string;
  instructions?: string;
  status?: MedicationStatus;
}

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
  initialData?: Medication;
  onCancel?: () => void;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState<MedicationCategory>(
    (initialData?.category as MedicationCategory) || "regular",
  );
  const [dosage, setDosage] = useState(initialData?.dosageAmount || "");
  const [frequency, setFrequency] = useState(initialData?.frequency || "");
  const [stockQuantity, setStockQuantity] = useState(
    initialData?.stockQuantity !== undefined && initialData?.stockQuantity !== null
      ? String(initialData.stockQuantity)
      : "",
  );
  const [stockAlertDate, setStockAlertDate] = useState(
    initialData?.stockAlertDate ? new Date(initialData.stockAlertDate).toISOString().split("T")[0] : "",
  );
  const [instructions, setInstructions] = useState(initialData?.instructions || "");
  const [status, setStatus] = useState<MedicationStatus>(
    (initialData?.status as MedicationStatus) || "active",
  );
  const hasOptionalData = !!(
    initialData?.stockQuantity ||
    initialData?.stockAlertDate ||
    initialData?.instructions
  );
  const [showOptional, setShowOptional] = useState(isEditing && hasOptionalData);
  const [showOcr, setShowOcr] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const data: MedicationFormData = {
      name: name.trim(),
      category,
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      ...(stockQuantity ? { stockQuantity: parseInt(stockQuantity, 10) } : {}),
      ...(stockAlertDate ? { stockAlertDate } : {}),
      ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
      ...(isEditing ? { status } : {}),
    };

    onSubmit(data);

    if (!isEditing) {
      setName("");
      setCategory("regular");
      setDosage("");
      setFrequency("");
      setStockQuantity("");
      setStockAlertDate("");
      setInstructions("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="med-name" className="block text-sm font-medium text-ink-700">
            薬の名前
          </label>
          <button
            type="button"
            onClick={() => setShowOcr((v) => !v)}
            aria-pressed={showOcr}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
              showOcr
                ? "bg-primary-600 text-white"
                : "bg-primary-50 text-primary-700 hover:bg-primary-100"
            }`}
          >
            <ScanText size={14} />
            画像から読み取り(OCR)
          </button>
        </div>
        <input
          id="med-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="薬の名前を入力"
        />
        {showOcr && (
          <div className="mt-2">
            <OcrImport onPick={(text) => setName(text)} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="med-category" className="block text-sm font-medium text-ink-700 mb-1">
          カテゴリ
        </label>
        <select
          id="med-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as MedicationCategory)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="regular">常用薬</option>
          <option value="supplement">サプリメント</option>
          <option value="prn">頓服薬</option>
          <option value="inhaler">吸入薬</option>
          <option value="eye_drops">目薬</option>
          <option value="patch">湿布</option>
          <option value="topical">塗り薬</option>
          <option value="flea_tick">ノミ・ダニ薬</option>
          <option value="heartworm">フィラリア薬</option>
        </select>
      </div>

      {isEditing && (
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">服用状況</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "active", label: "服用中", activeClass: "bg-primary-600 text-white border-primary-600" },
                { id: "paused", label: "休薬", activeClass: "bg-red-100 text-red-700 border-red-300" },
                { id: "discontinued", label: "中止", activeClass: "bg-red-600 text-white border-red-600" },
              ] as Array<{ id: MedicationStatus; label: string; activeClass: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatus(opt.id)}
                aria-pressed={status === opt.id}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  status === opt.id
                    ? opt.activeClass
                    : "bg-white text-ink-600 border-primary-200 hover:bg-primary-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-1">休薬・中止にすると今日の予定からも除外されます</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="med-dosage" className="block text-sm font-medium text-ink-700 mb-1">
            用量 <span className="text-xs text-ink-400 font-normal">任意</span>
          </label>
          <input
            id="med-dosage"
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="例: 1錠"
          />
        </div>
        <div>
          <label htmlFor="med-frequency" className="block text-sm font-medium text-ink-700 mb-1">
            頻度 <span className="text-xs text-ink-400 font-normal">任意</span>
          </label>
          <input
            id="med-frequency"
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="例: 1日1回"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="flex items-center space-x-1 text-sm text-ink-500 hover:text-ink-700 transition-colors"
      >
        {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>詳細設定（在庫・服用方法など）</span>
      </button>

      {showOptional && (
        <div className="space-y-4 pt-1">
          <div>
            <label htmlFor="med-stock" className="block text-sm font-medium text-ink-700 mb-1">
              在庫数(何日分)
            </label>
            <input
              id="med-stock"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 30"
            />
          </div>

          <div>
            <label htmlFor="med-alert-date" className="block text-sm font-medium text-ink-700 mb-1">
              在庫警告日
            </label>
            <input
              id="med-alert-date"
              type="date"
              value={stockAlertDate}
              onChange={(e) => setStockAlertDate(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-ink-400 mt-1">この日までに在庫が不足する場合に通知します</p>
          </div>

          <div>
            <label htmlFor="med-instructions" className="block text-sm font-medium text-ink-700 mb-1">
              服用方法
            </label>
            <textarea
              id="med-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="例: 食後に水と一緒に服用"
            />
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          {isEditing ? "更新する" : "追加する"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-primary-200 text-ink-700 rounded-lg hover:bg-primary-50 transition-colors"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
