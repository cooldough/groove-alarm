import { API_CONFIG } from './config';

const API_BASE_URL = API_CONFIG.baseUrl;

export interface Alarm {
  id: number;
  time: string;
  label: string;
  isActive: boolean;
  days: number[];
  soundId: number;
  danceSoundId: number;
  customAlarmSound: string | null;
  customDanceSound: string | null;
  isSnoozeEnabled: boolean;
  duration: number;
  isOneTime: boolean;
}

export interface Sound {
  id: number;
  name: string;
  url: string;
  category: string;
  isPremium: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getAlarms(): Promise<Alarm[]> {
  return apiRequest<Alarm[]>('/alarms');
}

export async function createAlarm(alarm: Omit<Alarm, 'id'>): Promise<Alarm> {
  return apiRequest<Alarm>('/alarms', {
    method: 'POST',
    body: JSON.stringify(alarm),
  });
}

export async function updateAlarm(
  id: number,
  alarm: Partial<Alarm>,
): Promise<Alarm> {
  return apiRequest<Alarm>(`/alarms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(alarm),
  });
}

export async function deleteAlarm(id: number): Promise<void> {
  await apiRequest(`/alarms/${id}`, { method: 'DELETE' });
}

export async function getSounds(): Promise<Sound[]> {
  return apiRequest<Sound[]>('/sounds');
}
