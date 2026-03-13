import { useState, useEffect, useCallback } from 'react';
import { useUpdateSetting } from '../../hooks/useSettings';
import { usePasswordStatus, useChangeMasterPassword, useUnlockVault, useLockVault } from '../../hooks/usePasswords';
import { useShortcuts, Shortcut, formatKeyCombo } from '../../hooks/useShortcuts';
import { useUiStore, Theme } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { apiFetch } from '../../lib/api';

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-matrix-surface border border-matrix-border rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-matrix-border/60">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
      {right}
    </div>
  );
}

function SettingRow({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${!last ? 'border-b border-matrix-border/30' : ''}`}>
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { language, setLanguage, theme, setTheme } = useUiStore();
  const updateSetting = useUpdateSetting();
  const { shortcuts, updateShortcuts, resetToDefaults } = useShortcuts();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>(shortcuts);
  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [logPath, setLogPath] = useState('');

  useEffect(() => {
    setLocalShortcuts(shortcuts);
    setHasChanges(false);
  }, [shortcuts]);

  const handleKeyRecord = useCallback(
    (e: KeyboardEvent) => {
      if (!recordingAction) return;
      e.preventDefault();
      e.stopPropagation();

      const combo = formatKeyCombo(e);
      if (!combo) return;

      setLocalShortcuts((prev) => prev.map((s) => (s.action === recordingAction ? { ...s, key: combo } : s)));
      setRecordingAction(null);
      setHasChanges(true);
    },
    [recordingAction],
  );

  useEffect(() => {
    if (recordingAction) {
      window.addEventListener('keydown', handleKeyRecord, true);
      return () => window.removeEventListener('keydown', handleKeyRecord, true);
    }
  }, [recordingAction, handleKeyRecord]);

  useEffect(() => {
    window.matrix.getLogs().then(setLogContent);
    window.matrix.getLogPath().then(setLogPath);
  }, []);

  const { data: passwordStatus, refetch: refetchPwdStatus } = usePasswordStatus();
  const changeMasterPwd = useChangeMasterPassword();
  const unlockVault = useUnlockVault();
  const lockVault = useLockVault();
  const [unlockPwd, setUnlockPwd] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    updateSetting.mutate({ key: 'language', value: lang });
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateSetting.mutate({ key: 'theme', value: newTheme });
  };

  const handleUnlock = async () => {
    try {
      await unlockVault.mutateAsync(unlockPwd);
      setUnlockPwd('');
      setUnlockError('');
      refetchPwdStatus();
    } catch {
      setUnlockError(t('incorrectPassword', language));
    }
  };

  const handleLock = async () => {
    await lockVault.mutateAsync();
    refetchPwdStatus();
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (newPwd.length < 8) {
      setPwdError(t('passwordTooShort', language));
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError(t('passwordsDoNotMatch', language));
      return;
    }
    try {
      await changeMasterPwd.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdSuccess(true);
      setTimeout(() => {
        setShowChangePassword(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdSuccess(false);
      }, 2000);
    } catch {
      setPwdError(t('incorrectCurrentPassword', language));
    }
  };

  const pilledButton = (active: boolean) =>
    `px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
      active ? 'bg-matrix-accent shadow-sm pilled-active' : 'text-gray-400 hover:text-gray-200 hover:bg-matrix-bg'
    }`;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-200 mb-6">{t('settings', language)}</h1>

      <div className="space-y-5">
        {/* ── Appearance ── */}
        <SectionCard>
          <SectionHeader title={language === 'es' ? 'Apariencia' : 'Appearance'} />
          <SettingRow label="Language / Idioma">
            <div className="flex bg-matrix-bg rounded-lg p-0.5">
              {(['en', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={pilledButton(language === lang)}
                >
                  {lang === 'en' ? 'English' : 'Español'}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Theme / Tema" last>
            <div className="flex bg-matrix-bg rounded-lg p-0.5">
              {(
                [
                  ['dark', 'Dark', 'Oscuro'],
                  ['light', 'Light', 'Claro'],
                ] as const
              ).map(([key, en, es]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key as Theme)}
                  className={pilledButton(theme === key)}
                >
                  {language === 'es' ? es : en}
                </button>
              ))}
            </div>
          </SettingRow>
        </SectionCard>

        {/* ── Keyboard Shortcuts ── */}
        <SectionCard>
          <button
            onClick={() => setShortcutsOpen(!shortcutsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left group"
          >
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              {t('keyboardShortcuts', language)}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-matrix-muted">{localShortcuts.length}</span>
              <svg
                className={`w-4 h-4 text-matrix-muted transition-transform duration-200 ${shortcutsOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </button>

          {shortcutsOpen && (
            <>
              <div className="border-t border-matrix-border/60">
                {localShortcuts.map((shortcut: Shortcut, i: number) => {
                  const isRecording = recordingAction === shortcut.action;
                  const conflict = localShortcuts.find(
                    (s) => s.action !== shortcut.action && s.key === shortcut.key && shortcut.key !== '',
                  );
                  const isLast = i === localShortcuts.length - 1;
                  return (
                    <div
                      key={shortcut.action}
                      className={`flex items-center justify-between px-4 py-2.5 hover:bg-matrix-bg/50 ${!isLast ? 'border-b border-matrix-border/30' : ''}`}
                    >
                      <span className="text-sm text-gray-400">{shortcut.label}</span>
                      <div className="flex items-center gap-2">
                        {conflict && (
                          <span
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs"
                            title={t('shortcutConflict', language)}
                          >
                            !
                          </span>
                        )}
                        <button
                          data-shortcut-recorder
                          onClick={() => setRecordingAction(isRecording ? null : shortcut.action)}
                          className={`min-w-[130px] px-3 py-1.5 rounded-md text-xs font-mono text-center transition-all ${
                            isRecording
                              ? 'bg-matrix-accent/10 border-2 border-matrix-accent/60 text-matrix-accent shadow-[0_0_8px_rgba(var(--matrix-accent)/0.15)]'
                              : 'bg-matrix-bg border border-matrix-border text-gray-300 hover:border-matrix-muted/50'
                          }`}
                        >
                          {isRecording
                            ? language === 'es'
                              ? 'Presiona teclas...'
                              : 'Press keys...'
                            : shortcut.key || '—'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-matrix-border/60 bg-matrix-bg/30">
                <button
                  onClick={() => {
                    resetToDefaults.mutate();
                    setHasChanges(false);
                    setRecordingAction(null);
                  }}
                  disabled={resetToDefaults.isPending}
                  className="text-xs text-matrix-muted hover:text-gray-300 transition-colors"
                >
                  {t('resetToDefaults', language)}
                </button>
                <button
                  onClick={() => {
                    updateShortcuts.mutate(localShortcuts);
                    setHasChanges(false);
                  }}
                  disabled={!hasChanges || updateShortcuts.isPending}
                  className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    hasChanges
                      ? 'bg-matrix-accent pilled-active shadow-sm hover:bg-matrix-accent-hover'
                      : 'bg-matrix-bg text-matrix-muted border border-matrix-border cursor-not-allowed'
                  }`}
                >
                  {updateShortcuts.isPending ? '...' : language === 'es' ? 'Guardar' : 'Save'}
                </button>
              </div>
            </>
          )}
        </SectionCard>

        {/* ── Vault ── */}
        {passwordStatus?.isSetup && (
          <SectionCard>
            <SectionHeader title={t('vault', language)} />
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                {passwordStatus.isUnlocked ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm text-matrix-success">
                      <span className="w-2 h-2 rounded-full bg-matrix-success" />
                      {language === 'es' ? 'Desbloqueado' : 'Unlocked'}
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-matrix-bg transition-colors"
                    >
                      {t('changeMasterPassword', language)}
                    </button>
                    <button
                      onClick={handleLock}
                      className="px-3 py-1.5 rounded-md text-xs text-gray-400 border border-matrix-border hover:text-gray-200 hover:bg-matrix-bg transition-colors"
                    >
                      {t('lock', language)}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="password"
                      value={unlockPwd}
                      onChange={(e) => {
                        setUnlockPwd(e.target.value);
                        setUnlockError('');
                      }}
                      placeholder={t('masterPassword', language)}
                      className="flex-1 bg-matrix-bg border border-matrix-border rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                    <button
                      onClick={handleUnlock}
                      disabled={!unlockPwd || unlockVault.isPending}
                      className="px-4 py-1.5 rounded-md text-sm bg-matrix-accent pilled-active hover:bg-matrix-accent-hover transition-colors disabled:opacity-40"
                    >
                      {t('unlock', language)}
                    </button>
                  </div>
                )}
              </div>
              {unlockError && <p className="text-xs text-matrix-danger mt-2">{unlockError}</p>}
            </div>
          </SectionCard>
        )}

        {/* ── Logs ── */}
        <SectionCard>
          <SectionHeader
            title="Logs"
            right={
              <button
                onClick={async () => {
                  await window.matrix.clearLogs();
                  setLogContent('');
                }}
                className="text-xs text-matrix-muted hover:text-gray-300 transition-colors"
              >
                {language === 'es' ? 'Limpiar' : 'Clear'}
              </button>
            }
          />
          <div className="p-3">
            <pre className="h-28 overflow-y-auto text-xs text-matrix-muted bg-matrix-bg rounded-md p-3 font-mono leading-relaxed">
              {logContent || (language === 'es' ? 'Sin logs' : 'No logs')}
            </pre>
            <p className="text-xs text-matrix-muted/60 mt-2 font-mono">{logPath}</p>
          </div>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <SectionCard className="border-matrix-danger/20">
          <SectionHeader title={language === 'es' ? 'Zona peligrosa' : 'Danger Zone'} />
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{language === 'es' ? 'Borrar base de datos' : 'Reset Database'}</p>
              <p className="text-xs text-matrix-muted mt-0.5">
                {language === 'es' ? 'Elimina todos los datos permanentemente' : 'Permanently deletes all data'}
              </p>
            </div>
            <button
              onClick={async () => {
                if (
                  window.confirm(
                    language === 'es'
                      ? '¿Borrar toda la base de datos? Esta acción no se puede deshacer.'
                      : 'Delete entire database? This cannot be undone.',
                  )
                ) {
                  if (
                    window.confirm(
                      language === 'es'
                        ? '¿Estás seguro? Todos los datos se perderán.'
                        : 'Are you sure? All data will be lost.',
                    )
                  ) {
                    await apiFetch('/db/reset', { method: 'POST' });
                    window.location.reload();
                  }
                }
              }}
              className="px-4 py-1.5 rounded-md text-sm text-matrix-danger border border-matrix-danger/30 hover:bg-matrix-danger/10 transition-colors whitespace-nowrap"
            >
              {language === 'es' ? 'Borrar' : 'Reset'}
            </button>
          </div>
        </SectionCard>
      </div>

      {/* ── Change Password Modal ── */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-matrix-surface border border-matrix-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">{t('changeMasterPassword', language)}</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder={t('currentPassword', language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
              />
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder={t('newPassword', language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder={t('newPasswordAgain', language)}
                className="w-full bg-matrix-bg border border-matrix-border rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
              />
              {pwdError && <p className="text-xs text-matrix-danger">{pwdError}</p>}
              {pwdSuccess && <p className="text-xs text-matrix-success">{t('passwordChanged', language)}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={changeMasterPwd.isPending || !currentPwd || !newPwd || !confirmPwd}
                  className="flex-1 px-4 py-2 text-sm bg-matrix-accent pilled-active rounded-md hover:bg-matrix-accent-hover transition-colors disabled:opacity-40"
                >
                  {t('save', language)}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPwdError('');
                    setCurrentPwd('');
                    setNewPwd('');
                    setConfirmPwd('');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 border border-matrix-border rounded-md hover:bg-matrix-bg transition-colors"
                >
                  {t('cancel', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
