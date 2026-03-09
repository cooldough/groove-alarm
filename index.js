import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { onBackgroundEvent } from './src/lib/notifications';

onBackgroundEvent(({ type, detail }) => {
  console.log('Background notification event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
