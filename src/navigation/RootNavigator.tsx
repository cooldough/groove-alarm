import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppStore } from '../lib/store';
import { onForegroundEvent, EventType } from '../lib/notifications';

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
  const { isFirstTimeUser, loadPersistedState, setActiveAlarmId } =
    useAppStore();

  useEffect(() => {
    loadPersistedState();

    const unsubscribe = onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification?.data;
        if (data?.alarmId && data?.type === 'alarm') {
          setActiveAlarmId(Number(data.alarmId));
        }
      }
    });

    return () => unsubscribe();
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
