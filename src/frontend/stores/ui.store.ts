import { create } from 'zustand';

export type Tab = 'overview' | 'projects' | 'tasks' | 'ideas' | 'analytics' | 'settings';
export type Theme = 'dark' | 'light';

interface UiState {
  activeTab: Tab;
  sidebarCollapsed: boolean;
  language: 'en' | 'es';
  theme: Theme;
  setActiveTab: (tab: Tab) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: 'en' | 'es') => void;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'overview',
  sidebarCollapsed: false,
  language: 'en',
  theme: 'dark',
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}));
