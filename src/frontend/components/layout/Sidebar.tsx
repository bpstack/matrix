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
      className={`flex flex-col bg-matrix-surface border-r border-matrix-border transition-all ${
        sidebarCollapsed ? 'w-12' : 'w-48'
      }`}
    >
      <div className="flex items-center justify-between h-10 px-3 border-b border-matrix-border">
        {!sidebarCollapsed && <span className="text-matrix-accent font-semibold text-sm tracking-wide">MATRIX</span>}
        <button onClick={toggleSidebar} className="text-matrix-muted hover:text-gray-300 transition-colors text-xs">
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 py-1">
        {tabs.map(({ key, icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-matrix-accent/10 text-matrix-accent'
                  : 'text-matrix-muted hover:text-matrix-accent hover:bg-matrix-accent/5'
              }`}
            >
              <span className="text-sm">{icon}</span>
              {!sidebarCollapsed && <span className="text-sm">{t(key, language)}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
