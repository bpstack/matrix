import React, { useState } from 'react';
import { useSettings, useUpdateSetting } from '../../hooks/useSettings';
import { useSubscriptions, useCreateSubscription, useUpdateUsage, useDeleteSubscription } from '../../hooks/useSubscriptions';
import { useUiStore, Theme } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

function usageColor(pct: number) {
  if (pct >= 80) return 'bg-red-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function SettingsView() {
  const { language, setLanguage, theme, setTheme } = useUiStore();
  const { data: settings } = useSettings();
  const updateSetting = useUpdateSetting();
  const { data: subs = [] } = useSubscriptions();
  const createSub = useCreateSubscription();
  const updateUsage = useUpdateUsage();
  const deleteSub = useDeleteSubscription();

  const [addingSub, setAddingSub] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCycle, setNewCycle] = useState('monthly');
  const [newResetDay, setNewResetDay] = useState(1);
  const [newBudget, setNewBudget] = useState(100);

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    updateSetting.mutate({ key: 'language', value: lang });
  };

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    updateSetting.mutate({ key: 'theme', value: t });
  };

  const handleAddSub = () => {
    if (!newName.trim()) return;
    createSub.mutate({ name: newName.trim(), cycle: newCycle, resetDay: newResetDay, budget: newBudget });
    setNewName(''); setNewCycle('monthly'); setNewResetDay(1); setNewBudget(100);
    setAddingSub(false);
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

        <div className="border border-matrix-border rounded-md p-3">
          <p className="text-xs text-matrix-muted mb-2">Theme / Tema</p>
          <div className="flex gap-2">
            {([['dark', '🌙', 'Dark', 'Oscuro'], ['light', '☀', 'Light', 'Claro']] as const).map(([key, icon, en, es]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as Theme)}
                className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1.5 ${
                  theme === key
                    ? 'bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30'
                    : 'bg-matrix-bg text-gray-400 border border-matrix-border hover:text-gray-300'
                }`}
              >
                <span>{icon}</span>
                {language === 'es' ? es : en}
              </button>
            ))}
          </div>
        </div>

        {/* AI Budget Section */}
        <div className="border border-matrix-border rounded-md p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-matrix-muted">AI Budget</p>
            <button onClick={() => setAddingSub(true)} className="text-xs text-matrix-accent hover:text-matrix-accent/80">+ Add</button>
          </div>

          {subs.length === 0 && !addingSub && (
            <p className="text-xs text-matrix-muted italic">{language === 'es' ? 'Sin suscripciones configuradas' : 'No subscriptions configured'}</p>
          )}

          <div className="space-y-2">
            {subs.map(sub => (
              <div key={sub.id} className="bg-matrix-bg rounded p-2.5 border border-matrix-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-200 font-medium">{sub.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-matrix-muted">{sub.cycle} / {language === 'es' ? 'dia' : 'day'} {sub.resetDay}</span>
                    <button onClick={() => deleteSub.mutate(sub.id)} className="text-[10px] text-red-400/60 hover:text-red-400">Del</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-matrix-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${usageColor(sub.currentUsed)}`} style={{ width: `${Math.min(sub.currentUsed, 100)}%` }} />
                  </div>
                  <input
                    type="number" min={0} max={100} value={sub.currentUsed}
                    onChange={e => updateUsage.mutate({ id: sub.id, currentUsed: Number(e.target.value) })}
                    className="w-14 bg-matrix-bg border border-matrix-border rounded px-1.5 py-0.5 text-xs text-gray-300 text-right outline-none"
                  />
                  <span className="text-xs text-matrix-muted">%</span>
                  <button onClick={() => updateUsage.mutate({ id: sub.id, currentUsed: 0 })} className="text-[10px] text-blue-400 hover:text-blue-300">Reset</button>
                </div>
              </div>
            ))}
          </div>

          {addingSub && (
            <div className="mt-2 bg-matrix-bg rounded p-2.5 border border-matrix-accent/20 space-y-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={language === 'es' ? 'Nombre (ej: Claude Code)' : 'Name (e.g. Claude Code)'}
                className="w-full bg-transparent border border-matrix-border rounded px-2 py-1 text-sm text-gray-200 outline-none" autoFocus />
              <div className="grid grid-cols-3 gap-2">
                <select value={newCycle} onChange={e => setNewCycle(e.target.value)}
                  className="bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-xs text-gray-300">
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <input type="number" value={newResetDay} onChange={e => setNewResetDay(Number(e.target.value))} min={0} max={31}
                  placeholder="Reset day" className="bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-xs text-gray-300 outline-none" />
                <input type="number" value={newBudget} onChange={e => setNewBudget(Number(e.target.value))} min={1} max={100}
                  placeholder="Budget %" className="bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-xs text-gray-300 outline-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setAddingSub(false)} className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300">{t('cancel', language)}</button>
                <button onClick={handleAddSub} disabled={!newName.trim()} className="px-2 py-1 text-xs bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30 rounded disabled:opacity-40">{t('create', language)}</button>
              </div>
            </div>
          )}
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
