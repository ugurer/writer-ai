import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  darkMode: boolean;
  autoSave: boolean;
  toggleDarkMode: () => void;
  setAutoSave: (enabled: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      autoSave: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setAutoSave: (enabled) => set({ autoSave: enabled }),
    }),
    {
      name: 'app-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
); 