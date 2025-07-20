import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  command: string;
  onTrigger: (command: string) => void;
}

const shortcuts: KeyboardShortcut[] = [
  { key: 'h', command: 'pnpm db:cli help:examples', onTrigger: () => {} },
  { key: 's', command: 'pnpm db:cli stats', onTrigger: () => {} },
  { key: 'e', command: 'pnpm db:cli examples:run', onTrigger: () => {} },
];

export const useKeyboardShortcuts = (copyToClipboard: (text: string) => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const shortcut = shortcuts.find(s => s.key === e.key);
        if (shortcut) {
          e.preventDefault();
          copyToClipboard(shortcut.command);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copyToClipboard]);
};
