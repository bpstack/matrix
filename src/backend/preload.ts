import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('matrix', {
  apiBase: 'http://localhost:3939',
  platform: process.platform,
  onThemeChange: (callback: (theme: string) => void) => {
    ipcRenderer.on('set-theme', (_event, theme: string) => callback(theme));
  },
});
