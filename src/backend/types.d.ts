declare module 'electron-squirrel-startup' {
  const started: boolean;
  export default started;
}

interface MatrixAPI {
  apiBase: string;
  platform: string;
  selectDirectory: () => Promise<string | null>;
  openDirectory: (path: string) => Promise<void>;
  onThemeChange: (callback: (theme: string) => void) => void;
  selectImportFile: () => Promise<string | null>;
}

declare global {
  interface Window {
    matrix: MatrixAPI;
  }
}
