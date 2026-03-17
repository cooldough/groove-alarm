import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Register background event handler for alarm notifications
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Background notification event:', type, detail);

  if (type === EventType.PRESS || type === EventType.DELIVERED) {
    const { notification } = detail;
    const alarmId = notification?.data?.alarmId;

    if (alarmId && notification?.data?.type === 'alarm') {
      // Cancel the notification so it stops ringing
      if (notification.id) {
        await notifee.cancelNotification(notification.id);
      }
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
