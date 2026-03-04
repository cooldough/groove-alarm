import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import { useKeepAwake } from 'expo-keep-awake';

import RootNavigator from './src/navigation/RootNavigator';
import { useAppStore } from './src/lib/store';
import { setupNotifications } from './src/lib/notifications';
import { initializePurchases } from './src/lib/purchases';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function App() {
  useKeepAwake();
  
  const [fontsLoaded] = useFonts({
    Orbitron: require('./assets/fonts/Orbitron-Bold.ttf'),
    Rajdhani: require('./assets/fonts/Rajdhani-Regular.ttf'),
    'Rajdhani-Bold': require('./assets/fonts/Rajdhani-Bold.ttf'),
    ShareTechMono: require('./assets/fonts/ShareTechMono-Regular.ttf'),
  });

  useEffect(() => {
    setupNotifications();
    initializePurchases();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
