'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, ExternalLink, ChevronLeft } from 'lucide-react';
import { useMedicationInfo } from '../../presentation/hooks/useMedicationInfo';

interface MedicationInfoApplyData {
  name?: string;
  instructions?: string;
}

interface MedicationInfoModalProps {
  isOpen: boolean;
  initialQuery: string;
  onClose: () => void;
  onApply: (data: MedicationInfoApplyData) => void;
}

export const MedicationInfoModal: React.FC<MedicationInfoModalProps> = ({
  isOpen,
  initialQuery,
  onClose,
  onApply,
}) => {
  const {
    searchResults,
    selectedInfo,
    isLoading,
    hasSearched,
    error,
    search,
    selectById,
    clearSelection,
    reset,
  } = useMedicationInfo();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
    reset();
    if (initialQuery.trim()) {
      void search(initialQuery);
    }
  }, [isOpen, initialQuery, reset, search]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) void search(trimmed);
  };

  const handleApply = () => {
    if (!selectedInfo) return;
    const parts: string[] = [];
    if (selectedInfo.efficacy) parts.push(`【効能】${selectedInfo.efficacy}`);
    if (selectedInfo.components) parts.push(`【成分】${selectedInfo.components}`);
    if (selectedInfo.remark) parts.push(`【備考】${selectedInfo.remark}`);
    onApply({
      name: selectedInfo.name,
      instructions: parts.length > 0 ? parts.join('\n\n') : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medication-info-title"
    >
      <div className="flex w-full max-h-[90vh] flex-col bg-white shadow-xl sm:mx-4 sm:max-w-lg sm:rounded-2xl rounded-t-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          {selectedInfo ? (
            <button
              type="button"
              onClick={clearSelection}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={16} className="mr-1" />
              戻る
            </button>
          ) : (
            <h2 id="medication-info-title" className="text-lg font-semibold">
              薬剤情報の取得
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {!selectedInfo && (
          <div className="border-b border-gray-200 p-4">
            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                placeholder="薬名を入力 (例: ロキソニン)"
                maxLength={100}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Search size={16} className="mr-1" />
                検索
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              提供: KEGG MEDICUS (公開薬剤データベース)
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 animate-spin" size={20} />
              <span>読み込み中...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error.message}
            </div>
          )}

          {!isLoading && !error && !selectedInfo && (
            <>
              {hasSearched && searchResults.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  該当する薬剤が見つかりませんでした
                </div>
              )}
              {!hasSearched && searchResults.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  薬名を入力して検索してください
                </div>
              )}
              {searchResults.length > 0 && (
                <ul className="space-y-2">
                  {searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => void selectById(r.id)}
                        className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {r.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">KEGG: {r.id}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {!isLoading && !error && selectedInfo && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500">名称</div>
                <div className="text-gray-900">{selectedInfo.name}</div>
              </div>
              {selectedInfo.efficacy && (
                <div>
                  <div className="text-xs font-medium text-gray-500">効能・効果</div>
                  <div className="whitespace-pre-wrap text-gray-900">
                    {selectedInfo.efficacy}
                  </div>
                </div>
              )}
              {selectedInfo.components && (
                <div>
                  <div className="text-xs font-medium text-gray-500">成分</div>
                  <div className="whitespace-pre-wrap text-gray-900">
                    {selectedInfo.components}
                  </div>
                </div>
              )}
              {selectedInfo.remark && (
                <div>
                  <div className="text-xs font-medium text-gray-500">備考</div>
                  <div className="whitespace-pre-wrap text-gray-900">
                    {selectedInfo.remark}
                  </div>
                </div>
              )}
              <a
                href={selectedInfo.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700"
              >
                <ExternalLink size={12} className="mr-1" />
                KEGGで詳細を見る
              </a>
              <p className="text-xs text-gray-400">
                ※ 本情報は参考用です。詳細は医師・薬剤師にご確認ください。
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-2 border-t border-gray-200 p-4">
          {selectedInfo ? (
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-lg bg-primary-600 py-2 text-white hover:bg-primary-700"
            >
              フォームに反映
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-gray-700 hover:bg-gray-50"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
