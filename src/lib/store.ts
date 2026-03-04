import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  isFirstTimeUser: boolean;
  isPremium: boolean;
  activeAlarmId: number | null;
  setFirstTimeUser: (value: boolean) => void;
  setPremium: (value: boolean) => void;
  setActiveAlarmId: (id: number | null) => void;
  loadPersistedState: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isFirstTimeUser: true,
  isPremium: false,
  activeAlarmId: null,
  
  setFirstTimeUser: async (value: boolean) => {
    await AsyncStorage.setItem('firstTimeUser', JSON.stringify(value));
    set({ isFirstTimeUser: value });
  },
  
  setPremium: async (value: boolean) => {
    await AsyncStorage.setItem('isPremium', JSON.stringify(value));
    set({ isPremium: value });
  },
  
  setActiveAlarmId: (id: number | null) => {
    set({ activeAlarmId: id });
  },
  
  loadPersistedState: async () => {
    try {
      const firstTimeUser = await AsyncStorage.getItem('firstTimeUser');
      const isPremium = await AsyncStorage.getItem('isPremium');
      
      set({
        isFirstTimeUser: firstTimeUser ? JSON.parse(firstTimeUser) : true,
        isPremium: isPremium ? JSON.parse(isPremium) : false,
      });
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  },
}));
