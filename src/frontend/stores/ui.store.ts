import { create } from 'zustand';

export type Tab = 'overview' | 'projects' | 'tasks' | 'ideas' | 'passwords' | 'settings';

interface UiState {
  activeTab: Tab;
  sidebarCollapsed: boolean;
  language: 'en' | 'es';
  setActiveTab: (tab: Tab) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: 'en' | 'es') => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'overview',
  sidebarCollapsed: false,
  language: 'en',
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setLanguage: (language) => set({ language }),
}));
