import React from 'react';
import { useUiStore, Tab } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

const tabs: { key: Tab; icon: string }[] = [
  { key: 'overview', icon: '◈' },
  { key: 'projects', icon: '◫' },
  { key: 'tasks', icon: '☰' },
  { key: 'ideas', icon: '✦' },
  { key: 'passwords', icon: '🔒' },
  { key: 'settings', icon: '⚙' },
];

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar, language } = useUiStore();

  return (
    <aside
      className={`flex flex-col bg-matrix-bg border-r border-matrix-border transition-all ${
        sidebarCollapsed ? 'w-14' : 'w-52'
      }`}
    >
      <div className="flex items-center justify-between h-12 px-4 border-b border-matrix-border">
        {!sidebarCollapsed && (
          <span className="text-matrix-accent font-bold text-lg tracking-wider">MATRIX</span>
        )}
        <button
          onClick={toggleSidebar}
          className="text-matrix-muted hover:text-gray-200 transition-colors"
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
                  ? 'bg-matrix-accent/10 text-matrix-accent'
                  : disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-matrix-muted hover:text-gray-200 hover:bg-white/[0.04]'
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
