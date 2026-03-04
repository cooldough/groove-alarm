import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import { useAppStore } from '../lib/store';
import { addNotificationResponseListener } from '../lib/notifications';

import OnboardingScreen from '../screens/OnboardingScreen';
import PaywallScreen from '../screens/PaywallScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AlarmTriggerScreen from '../screens/AlarmTriggerScreen';
import SuccessScreen from '../screens/SuccessScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import TermsScreen from '../screens/TermsScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Paywall: { fromOnboarding?: boolean };
  Dashboard: undefined;
  AlarmTrigger: { alarmId: number; duration: number };
  Success: { duration: number; score: number; comment: string };
  Privacy: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isFirstTimeUser, loadPersistedState, setActiveAlarmId } = useAppStore();

  useEffect(() => {
    loadPersistedState();
    
    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.alarmId && data?.type === 'alarm') {
        setActiveAlarmId(data.alarmId as number);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0E17' },
        animation: 'fade',
      }}
    >
      {isFirstTimeUser ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Paywall" component={PaywallScreen} />
        </>
      ) : null}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen 
        name="AlarmTrigger" 
        component={AlarmTriggerScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
}
