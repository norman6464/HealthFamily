import React from "react";

export interface TabOption {
  id: string;
  label: string;
  count?: number;
}

interface TabSwitchProps {
  tabs: TabOption[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabSwitch: React.FC<TabSwitchProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex bg-primary-50 rounded-2xl p-1 mb-4" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-white text-primary-600 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`ml-1 text-xs ${
                activeTab === tab.id ? "text-primary-400" : "text-ink-400"
              }`}
            >
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
