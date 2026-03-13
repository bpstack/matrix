import { app, BrowserWindow, session, Menu, ipcMain, dialog, shell, autoUpdater } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';
import { expressApp } from './server';
import { initDb } from './db/connection';
import { runMigrations } from './db/migrate';
import { API_PORT } from './config/constants';
import { logger } from './lib/logger';
import type { Server } from 'http';

process.on('uncaughtException', (err) => {
  logger.error('main', 'Uncaught exception', { stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('main', 'Unhandled rejection', { reason: String(reason) });
});

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let server: Server | null = null;

function configureCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !app.isPackaged;
    const csp = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:* ws://localhost:* https://zenquotes.io https://hacker-news.firebaseio.com https://api.github.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
      : "default-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3939 https://zenquotes.io https://hacker-news.firebaseio.com https://api.github.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

function sendTheme(theme: string) {
  if (mainWindow) {
    mainWindow.webContents.send('set-theme', theme);
    if (theme === 'light') {
      mainWindow.setBackgroundColor('#f5f5f5');
    } else {
      mainWindow.setBackgroundColor('#111111');
    }
  }
}

let manualUpdateCheck = false;

function setupAutoUpdaterListeners(): void {
  autoUpdater.on('update-available', () => {
    if (manualUpdateCheck) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is being downloaded...',
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (manualUpdateCheck) {
      dialog.showMessageBox({
        type: 'info',
        title: 'No Updates',
        message: 'You are running the latest version.',
      });
      manualUpdateCheck = false;
    }
  });

  autoUpdater.on('update-downloaded', () => {
    manualUpdateCheck = false;
    const choice = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Restart Now', 'Later'],
      title: 'Update Ready',
      message: 'Update downloaded. Restart to apply?',
    });
    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    if (manualUpdateCheck) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Error',
        message: `Error checking for updates: ${err.message}`,
      });
      manualUpdateCheck = false;
    }
  });
}

function checkForUpdatesManual(): void {
  if (!app.isPackaged) {
    dialog.showMessageBox({ message: 'Updates only work in packaged builds.', type: 'info' });
    return;
  }

  manualUpdateCheck = true;
  autoUpdater.checkForUpdates();
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Dark',
              type: 'radio',
              checked: true,
              click: () => sendTheme('dark'),
            },
            {
              label: 'Light',
              type: 'radio',
              click: () => sendTheme('light'),
            },
          ],
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: checkForUpdatesManual,
        },
        { type: 'separator' },
        {
          label: 'About Matrix',
          click: () => {
            dialog.showMessageBox({
              message: `Matrix — Strategic Personal Professional System\n\nVersion: ${app.getVersion()}`,
              type: 'info',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const createWindow = (): void => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.ico')
    : path.join(__dirname, '../../assets/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Matrix',
    icon: iconPath,
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Native right-click context menu for all input/text fields
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const menu = Menu.buildFromTemplate([
      { role: 'undo', enabled: params.editFlags.canUndo },
      { role: 'redo', enabled: params.editFlags.canRedo },
      { type: 'separator' },
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { role: 'selectAll', enabled: params.editFlags.canSelectAll },
    ]);
    menu.popup();
  });
};

app.on('ready', () => {
  configureCSP();
  initDb();
  runMigrations();
  buildMenu();

  if (app.isPackaged) {
    updateElectronApp({
      repo: 'bpstack/matrix',
      logger: console,
    });
    setupAutoUpdaterListeners();
  }

  ipcMain.handle('get-logs', () => logger.getContent());
  ipcMain.handle('clear-logs', () => logger.clear());
  ipcMain.handle('get-log-path', () => logger.getLogPath());

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('open-directory', async (_event, dirPath: string) => {
    if (fs.existsSync(dirPath)) {
      shell.openPath(dirPath);
    }
  });

  ipcMain.handle('open-external', async (_event, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle('select-import-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'Password Files', extensions: ['csv', 'txt'] }],
      title: 'Select password file to import',
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return fs.readFileSync(result.filePaths[0], 'utf-8');
  });

  server = expressApp.listen(API_PORT, () => {
    console.warn(`[Matrix] API running on http://localhost:${API_PORT}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});
