import { app, BrowserWindow, session, Menu, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { expressApp } from './server';
import { initDb } from './db/connection';
import { runMigrations } from './db/migrate';
import { API_PORT } from './config/constants';
import type { Server } from 'http';

process.on('uncaughtException', (err) => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'crash.log'), `${new Date().toISOString()} ${err.stack}\n`, { flag: 'a' });
  console.error('[Matrix] Uncaught:', err);
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
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:* ws://localhost:*; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        ],
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
          label: 'About Matrix',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({ message: 'Matrix — Strategic Personal Professional System', type: 'info' });
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
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', () => {
  configureCSP();
  initDb();
  runMigrations();
  buildMenu();

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('open-directory', async (_event, dirPath: string) => {
    if (fs.existsSync(dirPath)) {
      const { shell } = require('electron');
      shell.openPath(dirPath);
    }
  });

  server = expressApp.listen(API_PORT, () => {
    console.log(`[Matrix] API running on http://localhost:${API_PORT}`);
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
