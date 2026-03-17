import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  TriggerType,
  TimestampTrigger,
  EventType,
  Event,
} from '@notifee/react-native';
import { Platform } from 'react-native';

export async function setupNotifications() {
  const settings = await notifee.requestPermission();

  if (Platform.OS === 'android') {
    // Delete old channel if it exists (Android caches channel settings)
    try { await notifee.deleteChannel('groove_alarms'); } catch (_) {}
    try { await notifee.deleteChannel('alarms'); } catch (_) {}

    await notifee.createChannel({
      id: 'groove_alarms',
      name: 'Groove Alarms',
      importance: AndroidImportance.HIGH,
      vibration: false,
      lights: true,
      lightColor: '#FF00FF',
      sound: 'alarm_clock_1',
      visibility: AndroidVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  return settings.authorizationStatus >= 1;
}

export async function scheduleAlarm(
  alarmId: number,
  time: string,
  label: string,
  days: number[] = [],
  isOneTime: boolean = true,
): Promise<string[]> {
  const [hours, minutes] = time.split(':').map(Number);
  const notificationIds: string[] = [];

  if (isOneTime || days.length === 0) {
    const trigger = getNextTriggerDate(hours, minutes);

    const timestampTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: trigger.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    const id = await notifee.createTriggerNotification(
      {
        title: 'Groove Alarm',
        body: label || 'Time to wake up and dance!',
        data: { alarmId: String(alarmId), type: 'alarm' },
        android: {
          channelId: 'groove_alarms',
          importance: AndroidImportance.HIGH,
          sound: 'alarm_clock_1',
          category: AndroidCategory.ALARM,
          autoCancel: false,
          ongoing: true,
          fullScreenAction: {
            id: 'default',
          },
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'alarm.mp3',
          critical: true,
          criticalVolume: 1.0,
        },
      },
      timestampTrigger,
    );
    notificationIds.push(id);
  } else {
    for (const day of days) {
      const trigger = getNextWeekdayTrigger(hours, minutes, day);

      const timestampTrigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: trigger.getTime(),
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      const id = await notifee.createTriggerNotification(
        {
          title: 'Groove Alarm',
          body: label || 'Time to wake up and dance!',
          data: { alarmId: String(alarmId), type: 'alarm' },
          android: {
            channelId: 'groove_alarms',
            importance: AndroidImportance.HIGH,
            sound: 'alarm_clock_1',
            category: AndroidCategory.ALARM,
            autoCancel: false,
            ongoing: true,
            fullScreenAction: {
              id: 'default',
            },
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'alarm_clock_1.mp3',
            critical: true,
            criticalVolume: 1.0,
          },
        },
        timestampTrigger,
      );
      notificationIds.push(id);
    }
  }

  return notificationIds;
}

export async function cancelAlarm(notificationIds: string[]) {
  for (const id of notificationIds) {
    await notifee.cancelNotification(id);
  }
}

export async function cancelAllAlarms() {
  await notifee.cancelAllNotifications();
}

function getNextTriggerDate(hours: number, minutes: number): Date {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);

  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return trigger;
}

function getNextWeekdayTrigger(
  hours: number,
  minutes: number,
  targetDay: number,
): Date {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  let daysUntilTarget = (targetDay + 1 - currentDay + 7) % 7;

  if (daysUntilTarget === 0 && trigger <= now) {
    daysUntilTarget = 7;
  }

  trigger.setDate(trigger.getDate() + daysUntilTarget);
  return trigger;
}

export function onForegroundEvent(
  callback: (event: Event) => void,
): () => void {
  return notifee.onForegroundEvent(callback);
}

export function onBackgroundEvent(callback: (event: Event) => void): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    callback({ type, detail });
  });
}

export { EventType };
