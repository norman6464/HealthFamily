import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Medication, MedicationCategory } from '../../domain/entities/Medication';
import { MedicationInfoModal } from './MedicationInfoModal';

export interface MedicationFormData {
  name: string;
  category: MedicationCategory;
  dosage: string;
  frequency: string;
  stockQuantity?: number;
  stockAlertDate?: string;
  instructions?: string;
}

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
  initialData?: Medication;
  onCancel?: () => void;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<MedicationCategory>(initialData?.category || 'regular');
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [frequency, setFrequency] = useState(initialData?.frequency || '');
  const [stockQuantity, setStockQuantity] = useState(
    initialData?.stockQuantity !== undefined ? String(initialData.stockQuantity) : ''
  );
  const [stockAlertDate, setStockAlertDate] = useState(
    initialData?.stockAlertDate ? new Date(initialData.stockAlertDate).toISOString().split('T')[0] : ''
  );
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const hasOptionalData = !!(initialData?.stockQuantity || initialData?.stockAlertDate || initialData?.instructions);
  const [showOptional, setShowOptional] = useState(isEditing && hasOptionalData);
  const [showInfoModal, setShowInfoModal] = useState(false);

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
    };

    onSubmit(data);

    if (!isEditing) {
      setName('');
      setCategory('regular');
      setDosage('');
      setFrequency('');
      setStockQuantity('');
      setStockAlertDate('');
      setInstructions('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="med-name" className="block text-sm font-medium text-gray-700 mb-1">
          薬の名前
        </label>
        <div className="flex space-x-2">
          <input
            id="med-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="薬の名前を入力"
          />
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="flex items-center px-3 py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 text-sm whitespace-nowrap"
            aria-label="薬剤情報を取得"
          >
            <Info size={14} className="mr-1" />
            情報取得
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="med-category" className="block text-sm font-medium text-gray-700 mb-1">
          カテゴリ
        </label>
        <select
          id="med-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as MedicationCategory)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="med-dosage" className="block text-sm font-medium text-gray-700 mb-1">
            用量 <span className="text-xs text-gray-400 font-normal">任意</span>
          </label>
          <input
            id="med-dosage"
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="例: 1錠"
          />
        </div>
        <div>
          <label htmlFor="med-frequency" className="block text-sm font-medium text-gray-700 mb-1">
            頻度 <span className="text-xs text-gray-400 font-normal">任意</span>
          </label>
          <input
            id="med-frequency"
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="例: 1日1回"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>詳細設定（在庫・服用方法など）</span>
      </button>

      {showOptional && (
        <div className="space-y-4 pt-1">
          <div>
            <label htmlFor="med-stock" className="block text-sm font-medium text-gray-700 mb-1">
              在庫数(何日分)
            </label>
            <input
              id="med-stock"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 30"
            />
          </div>

          <div>
            <label htmlFor="med-alert-date" className="block text-sm font-medium text-gray-700 mb-1">
              在庫警告日
            </label>
            <input
              id="med-alert-date"
              type="date"
              value={stockAlertDate}
              onChange={(e) => setStockAlertDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">この日までに在庫が不足する場合に通知します</p>
          </div>

          <div>
            <label htmlFor="med-instructions" className="block text-sm font-medium text-gray-700 mb-1">
              服用方法
            </label>
            <textarea
              id="med-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
          {isEditing ? '更新する' : '追加する'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        )}
      </div>

      <MedicationInfoModal
        isOpen={showInfoModal}
        initialQuery={name}
        onClose={() => setShowInfoModal(false)}
        onApply={(data) => {
          if (data.name) setName(data.name);
          if (data.instructions) {
            setInstructions((prev) => (prev ? `${prev}\n${data.instructions}` : data.instructions ?? ''));
            setShowOptional(true);
          }
        }}
      />
    </form>
  );
};
