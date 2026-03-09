import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { useUiStore, Theme } from './stores/ui.store';
import { apiFetch } from './lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5000 },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useUiStore();

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  // Load saved theme from DB on startup
  useEffect(() => {
    apiFetch<Record<string, string>>('/settings').then(settings => {
      if (settings?.theme === 'light' || settings?.theme === 'dark') {
        setTheme(settings.theme as Theme);
      }
    }).catch(() => {});
  }, [setTheme]);

  // Listen for theme changes from Electron menu
  useEffect(() => {
    window.matrix?.onThemeChange?.((newTheme: string) => {
      if (newTheme === 'dark' || newTheme === 'light') {
        setTheme(newTheme as Theme);
      }
    });
  }, [setTheme]);

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
