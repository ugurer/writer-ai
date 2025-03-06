import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useStore } from '../store';

export function useEditor(content: string, onChange: (text: string) => void) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { settings, addToHistory } = useStore();

  // Otomatik kaydetme
  useEffect(() => {
    if (settings.autoSave && content) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        addToHistory();
        // Burada kaydetme işlemi yapılabilir
      }, settings.autoSaveInterval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, settings.autoSave, settings.autoSaveInterval]);

  // Klavye kısayolları
  const handleKeyCommand = useCallback((command: string): boolean => {
    switch (command) {
      case 'save':
        addToHistory();
        return true;
      case 'undo':
        // Geri alma işlemi
        return true;
      case 'redo':
        // İleri alma işlemi
        return true;
      default:
        return false;
    }
  }, []);

  // Platform'a göre klavye kısayolları
  const keyBindings = Platform.select({
    ios: {
      'cmd+s': 'save',
      'cmd+z': 'undo',
      'cmd+shift+z': 'redo',
    },
    android: {
      'ctrl+s': 'save',
      'ctrl+z': 'undo',
      'ctrl+shift+z': 'redo',
    },
    default: {
      'ctrl+s': 'save',
      'ctrl+z': 'undo',
      'ctrl+shift+z': 'redo',
    },
  });

  return {
    handleKeyCommand,
    keyBindings,
  };
} 