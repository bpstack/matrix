import React from 'react';
import { useSettings, useUpdateSetting } from '../../hooks/useSettings';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

export function SettingsView() {
  const { language, setLanguage } = useUiStore();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    updateSetting.mutate({ key: 'language', value: lang });
  };

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-lg font-medium text-gray-200 mb-4">{t('settings', language)}</h1>

      <div className="space-y-4">
        <div className="border border-matrix-border rounded-md p-3">
          <p className="text-xs text-matrix-muted mb-2">Language / Idioma</p>
          <div className="flex gap-2">
            {(['en', 'es'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === lang
                    ? 'bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30'
                    : 'bg-matrix-bg text-gray-400 border border-matrix-border hover:text-gray-300'
                }`}
              >
                {lang === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
        </div>

        {settings && Object.keys(settings).length > 0 && (
          <div className="border border-matrix-border rounded-md p-3">
            <p className="text-xs text-matrix-muted mb-2">Stored Settings</p>
            <div className="space-y-1">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-matrix-muted">{key}</span>
                  <span className="text-gray-400 font-mono text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
