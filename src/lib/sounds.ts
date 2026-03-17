export interface SoundOption {
  id: string;
  label: string;
  filename: string;
  isPro: boolean;
}

export const ALARM_SOUNDS: SoundOption[] = [
  { id: 'alarm_clock_1', label: 'Classic Alarm', filename: 'alarm_clock_1.mp3', isPro: false },
  { id: 'alarm_clock_2', label: 'Digital Alarm', filename: 'alarm_clock_2.mp3', isPro: true },
  { id: 'alarm_clock_3', label: 'Gentle Alarm', filename: 'alarm_clock_3.mp3', isPro: true },
];

export const DANCE_SOUNDS: SoundOption[] = [
  { id: 'dance_song_1', label: 'Dance Beat 1', filename: 'dance_song_1.mp3', isPro: false },
  { id: 'dance_song_2', label: 'Dance Beat 2', filename: 'dance_song_2.mp3', isPro: true },
];

export const CUSTOM_SOUND_ID = 'custom';

export function getSoundFilename(soundId: string, sounds: SoundOption[]): string | null {
  const sound = sounds.find((s) => s.id === soundId);
  return sound ? sound.filename : null;
}

export function getDefaultAlarmSoundId(): string {
  return 'alarm_clock_1';
}

export function getDefaultDanceSoundId(): string {
  return 'dance_song_1';
}
