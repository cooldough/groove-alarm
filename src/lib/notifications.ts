import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const ALARM_TASK = 'ALARM_TRIGGER_TASK';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function setupNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF00FF',
      sound: 'alarm.wav',
      enableVibrate: true,
      bypassDnd: true,
    });
  }

  return true;
}

export async function scheduleAlarm(
  alarmId: number,
  time: string,
  label: string,
  days: number[] = [],
  isOneTime: boolean = true
): Promise<string[]> {
  const [hours, minutes] = time.split(':').map(Number);
  const notificationIds: string[] = [];

  if (isOneTime || days.length === 0) {
    const trigger = getNextTriggerDate(hours, minutes);
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Groove Alarm',
        body: label || 'Time to wake up and dance!',
        sound: 'alarm.wav',
        priority: 'max',
        data: { alarmId, type: 'alarm' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: 'alarms',
      },
    });
    notificationIds.push(id);
  } else {
    for (const day of days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Groove Alarm',
          body: label || 'Time to wake up and dance!',
          sound: 'alarm.wav',
          priority: 'max',
          data: { alarmId, type: 'alarm' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1,
          hour: hours,
          minute: minutes,
          channelId: 'alarms',
        },
      });
      notificationIds.push(id);
    }
  }

  return notificationIds;
}

export async function cancelAlarm(notificationIds: string[]) {
  for (const id of notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export async function cancelAllAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
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

export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
