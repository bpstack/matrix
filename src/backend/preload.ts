import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('matrix', {
  apiBase: 'http://localhost:3939',
  platform: process.platform,
});
