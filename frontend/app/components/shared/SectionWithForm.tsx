import React from "react";
import { type LucideIcon, Plus, X } from "lucide-react";
import { Link } from "react-router";

/**
 * セクション共通コンポーネント
 * 通院管理ページの各セクション(ワクチン、検査、アレルギー等)の
 * ヘッダー・フォーム表示切替・メンバー未登録警告を共通化
 */
interface SectionWithFormProps {
  /** セクションタイトル */
  title: string;
  /** タイトル横のアイコン */
  icon: LucideIcon;
  /** フォーム表示中かどうか */
  showForm: boolean;
  /** フォーム表示切替コールバック */
  onToggleForm: () => void;
  /** メンバーが利用可能か(認証・読み込み完了 and メンバー1件以上) */
  membersReady: boolean;
  /** メンバーが0件か */
  hasNoMembers: boolean;
  /** フォームコンテンツ(showForm && membersReady時に表示) */
  formContent: React.ReactNode;
  /** リストコンテンツ(常に表示) */
  children: React.ReactNode;
  /** フォーム追加ボタンのaria-label */
  addLabel: string;
  /** フォームのタイトル */
  formTitle: string;
}

export const SectionWithForm: React.FC<SectionWithFormProps> = ({
  title,
  icon: Icon,
  showForm,
  onToggleForm,
  membersReady,
  hasNoMembers,
  formContent,
  children,
  addLabel,
  formTitle,
}) => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon size={18} className="text-primary-600" />
          <h2 className="text-base font-bold text-ink-800">{title}</h2>
        </div>
        <button
          onClick={onToggleForm}
          className="bg-primary text-white p-1.5 rounded-full hover:bg-primary-dark transition-colors"
          aria-label={showForm ? "閉じる" : addLabel}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {showForm && membersReady && !hasNoMembers && (
        <div className="mb-4 bg-white rounded-2xl shadow-md p-4 border border-primary-100">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">{formTitle}</h3>
          {formContent}
        </div>
      )}

      {showForm && hasNoMembers && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-700">
          先に
          <Link
            to="/members"
            className="underline font-medium text-yellow-800 hover:text-yellow-900"
          >
            メンバーページ
          </Link>
          でメンバーを登録してください。
        </div>
      )}

      {children}
    </div>
  );
};
