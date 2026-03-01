import React, { useState } from 'react';
import { Search, Pill } from 'lucide-react';
import { MedicationSearchResult } from '../../domain/entities/MedicationSearchResult';
import { useMedicationSearch } from '../../presentation/hooks/useMedicationSearch';

interface MedicationSearchProps {
  onSelectResult?: (result: MedicationSearchResult) => void;
}

export const MedicationSearch: React.FC<MedicationSearchProps> = ({ onSelectResult }) => {
  const [query, setQuery] = useState('');
  const { results, isSearching, hasSearched, search } = useMedicationSearch();

  const handleSearch = () => {
    if (query.trim()) {
      search(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="お薬名で検索..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="お薬検索"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isSearching ? '検索中...' : '検索'}
        </button>
      </div>

      {hasSearched && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">該当するお薬が見つかりません</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => onSelectResult?.(result)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectResult?.(result); }}
            >
              <div className="flex items-center space-x-2">
                <Pill size={16} className="text-primary-600" />
                <span className="text-sm font-medium text-gray-800">{result.name}</span>
                <span className="text-xs text-gray-500">({result.memberName})</span>
              </div>
              {result.dosageAmount && (
                <p className="text-xs text-gray-500 mt-1 ml-6">{result.dosageAmount}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
