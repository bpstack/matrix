interface MatrixAPI {
  apiBase: string;
  platform: string;
  onThemeChange: (callback: (theme: string) => void) => void;
  selectDirectory: () => Promise<string | null>;
  openDirectory: (path: string) => Promise<void>;
  selectImportFile: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  getLogs: () => Promise<string>;
  clearLogs: () => Promise<void>;
  getLogPath: () => Promise<string>;
}

declare global {
  interface Window {
    matrix: MatrixAPI;
  }
}

export {};
