import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultAlarmSoundId, getDefaultDanceSoundId } from './sounds';

export interface AlarmConfig {
  id: number;
  time: string;
  label: string;
  isActive: boolean;
  days: number[];
  duration: number;
  isOneTime: boolean;
  notificationIds: string[];
  alarmSoundId: string;
  danceSoundId: string;
  customAlarmSoundUri?: string;
  customDanceSoundUri?: string;
}

interface AppState {
  isFirstTimeUser: boolean;
  isPremium: boolean;
  activeAlarmId: number | null;
  alarms: AlarmConfig[];

  setFirstTimeUser: (value: boolean) => void;
  setPremium: (value: boolean) => void;
  setActiveAlarmId: (id: number | null) => void;
  addAlarm: (alarm: Omit<AlarmConfig, 'id' | 'notificationIds'>) => AlarmConfig;
  updateAlarm: (id: number, data: Partial<AlarmConfig>) => void;
  deleteAlarm: (id: number) => void;
  getAlarm: (id: number) => AlarmConfig | undefined;
  loadPersistedState: () => Promise<void>;
}

const persistAlarms = async (alarms: AlarmConfig[]) => {
  try {
    await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
  } catch (e) {
    console.error('Failed to persist alarms:', e);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  isFirstTimeUser: true,
  isPremium: false,
  activeAlarmId: null,
  alarms: [],

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

  addAlarm: (alarmData) => {
    const newAlarm: AlarmConfig = {
      ...alarmData,
      id: Date.now(),
      notificationIds: [],
      alarmSoundId: alarmData.alarmSoundId || getDefaultAlarmSoundId(),
      danceSoundId: alarmData.danceSoundId || getDefaultDanceSoundId(),
    };
    const updated = [...get().alarms, newAlarm];
    set({ alarms: updated });
    persistAlarms(updated);
    return newAlarm;
  },

  updateAlarm: (id, data) => {
    const updated = get().alarms.map((a) =>
      a.id === id ? { ...a, ...data } : a
    );
    set({ alarms: updated });
    persistAlarms(updated);
  },

  deleteAlarm: (id) => {
    const updated = get().alarms.filter((a) => a.id !== id);
    set({ alarms: updated });
    persistAlarms(updated);
  },

  getAlarm: (id) => {
    return get().alarms.find((a) => a.id === id);
  },

  loadPersistedState: async () => {
    try {
      const firstTimeUser = await AsyncStorage.getItem('firstTimeUser');
      const isPremium = await AsyncStorage.getItem('isPremium');
      const alarmsJson = await AsyncStorage.getItem('alarms');

      set({
        isFirstTimeUser: firstTimeUser ? JSON.parse(firstTimeUser) : true,
        isPremium: isPremium ? JSON.parse(isPremium) : false,
        alarms: alarmsJson ? JSON.parse(alarmsJson) : [],
      });
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  },
}));
