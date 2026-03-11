import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('matrix', {
  apiBase: 'http://localhost:3939',
  platform: process.platform,
  onThemeChange: (callback: (theme: string) => void) => {
    ipcRenderer.on('set-theme', (_event, theme: string) => callback(theme));
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openDirectory: (path: string) => ipcRenderer.invoke('open-directory', path),
  selectImportFile: () => ipcRenderer.invoke('select-import-file'),
});
