import React from 'react';
import { Sidebar } from './Sidebar';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

export function AppShell() {
  const { activeTab, language } = useUiStore();

  const renderContent = () => {
    if (activeTab === 'passwords') {
      return (
        <div className="flex items-center justify-center h-full text-matrix-muted">
          <p className="text-xl">{t('comingSoon', language)}</p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-matrix-muted">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-300 mb-2 capitalize">
            {t(activeTab, language)}
          </h2>
          <p className="text-sm">{t('selectTab', language)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-matrix-bg text-gray-200">
      <Sidebar />
      <main className="flex-1 overflow-auto">{renderContent()}</main>
    </div>
  );
}
