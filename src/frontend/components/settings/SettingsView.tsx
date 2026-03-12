import { useState } from 'react';
import { useUpdateSetting } from '../../hooks/useSettings';
import { usePasswordStatus, useChangeMasterPassword, useUnlockVault, useLockVault } from '../../hooks/usePasswords';
import { useUiStore, Theme } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { apiFetch } from '../../lib/api';

export function SettingsView() {
  const { language, setLanguage, theme, setTheme } = useUiStore();
  const updateSetting = useUpdateSetting();

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

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    updateSetting.mutate({ key: 'theme', value: t });
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

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-lg font-medium text-gray-200 mb-4">{t('settings', language)}</h1>

      <div className="space-y-4">
        <div className="border border-matrix-border rounded-md p-3">
          <p className="text-xs text-matrix-muted mb-2">Language / Idioma</p>
          <div className="flex gap-2">
            {(['en', 'es'] as const).map((lang) => (
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
            {(
              [
                ['dark', '🌙', 'Dark', 'Oscuro'],
                ['light', '☀', 'Light', 'Claro'],
              ] as const
            ).map(([key, icon, en, es]) => (
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

        {passwordStatus?.isSetup && (
          <div className="border border-matrix-border rounded-md p-3">
            <p className="text-xs text-matrix-muted mb-2">{t('vault', language)}</p>
            <div className="flex items-center gap-2">
              {passwordStatus.isUnlocked ? (
                <button
                  onClick={handleLock}
                  className="px-3 py-1.5 rounded text-sm bg-matrix-bg text-gray-400 border border-matrix-border hover:text-gray-200 transition-colors"
                >
                  🔒 {t('lock', language)}
                </button>
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
                    className="flex-1 bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                  <button
                    onClick={handleUnlock}
                    disabled={!unlockPwd || unlockVault.isPending}
                    className="px-3 py-1.5 rounded text-sm bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30 hover:bg-matrix-accent/20 transition-colors disabled:opacity-40"
                  >
                    {t('unlock', language)}
                  </button>
                </div>
              )}
              {passwordStatus.isUnlocked && (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="px-3 py-1.5 rounded text-sm text-gray-400 border border-matrix-border hover:text-gray-200 transition-colors"
                >
                  {t('changeMasterPassword', language)}
                </button>
              )}
            </div>
            {unlockError && <p className="text-xs text-red-400 mt-2">{unlockError}</p>}
          </div>
        )}

        {showChangePassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-matrix-bg border border-matrix-border rounded-lg p-6 w-full max-w-md">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">{t('changeMasterPassword', language)}</h3>
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder={t('currentPassword', language)}
                  className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
                />
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder={t('newPassword', language)}
                  className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
                />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder={t('newPasswordAgain', language)}
                  className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-matrix-accent/50"
                />
                {pwdError && <p className="text-xs text-red-400">{pwdError}</p>}
                {pwdSuccess && <p className="text-xs text-green-400">{t('passwordChanged', language)}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changeMasterPwd.isPending || !currentPwd || !newPwd || !confirmPwd}
                    className="flex-1 px-3 py-1.5 text-sm bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30 rounded hover:bg-matrix-accent/20 transition-colors disabled:opacity-40"
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
                    className="px-3 py-1.5 text-sm text-gray-400 border border-matrix-border rounded hover:bg-matrix-border/50 transition-colors"
                  >
                    {t('cancel', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="border border-red-900/30 rounded-md p-3 bg-red-950/10">
          <p className="text-xs text-red-400/70 mb-2">Danger Zone</p>
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
            className="px-3 py-1.5 rounded text-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            {language === 'es' ? 'Borrar base de datos' : 'Reset Database'}
          </button>
        </div>
      </div>
    </div>
  );
}
