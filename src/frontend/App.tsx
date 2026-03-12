import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { useUiStore, Theme } from './stores/ui.store';
import { apiFetch } from './lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 401s — vault is locked, retrying won't help
        if (error instanceof Error && error.message === 'Vault is locked') return false;
        return failureCount < 1;
      },
      staleTime: 5000,
      refetchOnMount: 'always',
    },
    mutations: {
      onError: (error) => {
        // Auto-redirect to lock screen when vault locks by inactivity
        if (error instanceof Error && error.message === 'Vault is locked') {
          queryClient.invalidateQueries({ queryKey: ['passwords', 'status'] });
        }
      },
    },
  },
});

// Also handle 401 on queries (auto-lock detection)
queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === 'updated' &&
    event.query.state.error instanceof Error &&
    event.query.state.error.message === 'Vault is locked'
  ) {
    queryClient.invalidateQueries({ queryKey: ['passwords', 'status'] });
  }
});

// Read cached theme before React renders to prevent flash
const cachedTheme = localStorage.getItem('matrix-theme');
if (cachedTheme === 'light' || cachedTheme === 'dark') {
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(cachedTheme);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useUiStore();

  // Sync Zustand with cached theme on mount
  useEffect(() => {
    const cached = localStorage.getItem('matrix-theme');
    if (cached === 'light' || cached === 'dark') {
      setTheme(cached as Theme);
    }
  }, [setTheme]);

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('matrix-theme', theme);
  }, [theme]);

  // Load saved theme from DB on startup and apply if different
  useEffect(() => {
    apiFetch<Record<string, string>>('/settings')
      .then((settings) => {
        if (settings?.theme === 'light' || settings?.theme === 'dark') {
          setTheme(settings.theme as Theme);
        }
      })
      .catch(() => {});
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
