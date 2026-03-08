import React from 'react';
import { useUiStore, Tab } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

const tabs: { key: Tab; icon: string }[] = [
  { key: 'overview', icon: '◉' },
  { key: 'projects', icon: '▦' },
  { key: 'tasks', icon: '☑' },
  { key: 'ideas', icon: '✦' },
  { key: 'passwords', icon: '🔒' },
  { key: 'settings', icon: '⚙' },
];

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar, language } = useUiStore();

  return (
    <aside
      className={`flex flex-col bg-surface-1 border-r border-surface-3 transition-all ${
        sidebarCollapsed ? 'w-16' : 'w-52'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-surface-3">
        {!sidebarCollapsed && (
          <span className="text-accent font-bold text-lg tracking-wider">MATRIX</span>
        )}
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 py-2">
        {tabs.map(({ key, icon }) => {
          const isActive = activeTab === key;
          const disabled = key === 'passwords';
          return (
            <button
              key={key}
              onClick={() => !disabled && setActiveTab(key)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-surface-2 text-accent border-r-2 border-accent'
                  : disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-surface-2'
              }`}
            >
              <span className="text-base">{icon}</span>
              {!sidebarCollapsed && <span>{t(key, language)}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
