import { Platform } from 'react-native';

export const APP_CONFIG = {
  name: 'Groove Alarm',
  version: '1.0.0',
  bundleId: 'com.kalopsialabs.groovealarm',
  company: 'Kalopsia Labs',
  supportEmail: 'support@kalopsialabs.com',
};

export const REVENUECAT_API_KEYS = {
  ios: 'YOUR_REVENUECAT_IOS_API_KEY',
  android: 'YOUR_REVENUECAT_ANDROID_API_KEY',
};

export const API_CONFIG = {
  baseUrl: __DEV__
    ? 'http://localhost:5000/api'
    : 'https://your-app-url.replit.app/api',
};

export function getRevenueCatApiKey(): string {
  return Platform.OS === 'ios'
    ? REVENUECAT_API_KEYS.ios
    : REVENUECAT_API_KEYS.android;
}
