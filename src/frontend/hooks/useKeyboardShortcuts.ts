import { useEffect, useCallback } from 'react';
import { useUiStore } from '../stores/ui.store';

export function useKeyboardShortcuts() {
  const { setActiveTab, toggleSidebar, openQuickCreate } = useUiStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

      if (isInputFocused) return;

      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          setActiveTab('overview');
          break;
        case '2':
          e.preventDefault();
          setActiveTab('projects');
          break;
        case '3':
          e.preventDefault();
          setActiveTab('tasks');
          break;
        case '4':
          e.preventDefault();
          setActiveTab('ideas');
          break;
        case '5':
          e.preventDefault();
          setActiveTab('passwords');
          break;
        case ',':
          e.preventDefault();
          setActiveTab('settings');
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          toggleSidebar();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setActiveTab('tasks');
          openQuickCreate('task');
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setActiveTab('ideas');
          openQuickCreate('idea');
          break;
      }
    },
    [setActiveTab, toggleSidebar, openQuickCreate],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
