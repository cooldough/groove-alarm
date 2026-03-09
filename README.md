# Groove Alarm

> The alarm clock that makes you dance to wake up!

[![React Native](https://img.shields.io/badge/React%20Native-0.73-61DAFB?logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## About

Groove Alarm is a unique alarm clock app that requires you to physically dance to dismiss your alarms. Using your phone's front camera, the app detects motion across a 3x3 grid and won't stop ringing until you've danced for the required duration. After dancing, you get a score (0-100) with a funny comment and can share a branded video card to social media.

### Features

- **Motion Detection** - Camera-based 3x3 grid movement tracking via react-native-vision-camera
- **Movement Scoring** - Score 0-100 based on intensity, consistency, zone variety, and peak movement
- **Funny Comments** - Score-based reactions like "Beyonce called, she's worried" (95-100)
- **Branded Share Cards** - Dark neon share card with score, comment, and app branding
- **Video Export** - Save dance videos to camera roll via @react-native-camera-roll/camera-roll
- **Native Share Sheet** - Share to TikTok, Instagram, WhatsApp via react-native-share
- **Native Alarms** - True alarm notifications via @notifee/react-native (bypasses DND on Android)
- **Dual Audio Crossfade** - Alarm ringtone fades to dance music via react-native-sound
- **Cyberpunk Theme** - Sleek neon pink/cyan dark UI with Orbitron font

---

## Free vs Pro ($2.99 Lifetime)

| Feature | Free | Pro |
|---------|:----:|:---:|
| Dance Duration | 15s only | 15s - 3min |
| Repeat Alarms | One-time only | Mon-Sun scheduling |
| Sounds | 2 basic | All premium sounds |
| Alarms | Unlimited | Unlimited |
| Price | Free | $2.99 one-time |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [React Native CLI](https://reactnative.dev/docs/environment-setup) (follow "React Native CLI Quickstart")
- Android Studio with SDK 34+ (for Android)
- Xcode 15+ with CocoaPods (for iOS, Mac only)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/groove-alarm.git
cd groove-alarm

npm install

# Link native font and sound assets
npx react-native-asset

# iOS only: Install CocoaPods
cd ios && pod install && cd ..
```

### Running

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios
```

---

## Building for Production

### Android APK

```bash
cd android
./gradlew assembleDebug       # Debug APK
./gradlew assembleRelease     # Release APK (needs signing keystore)
./gradlew bundleRelease       # AAB for Play Store
```

### iOS

```bash
cd ios && pod install && cd ..
open ios/GrooveAlarm.xcworkspace
# In Xcode: Product → Archive → Distribute
```

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed build and signing instructions.

---

## Project Structure

```
groove-alarm/
├── App.tsx                        # App entry point (navigation, providers)
├── app.json                       # React Native CLI config
├── index.js                       # AppRegistry entry
├── package.json                   # Dependencies (bare RN CLI)
│
├── src/
│   ├── components/
│   │   ├── AlarmCard.tsx          # Alarm list item with Pro badges
│   │   ├── Badge.tsx              # Status badges
│   │   ├── Button.tsx             # Custom neon button (haptic feedback)
│   │   ├── Card.tsx               # Card container
│   │   ├── CreateAlarmModal.tsx   # Alarm creation (15s free / Pro durations)
│   │   ├── MotionDetector.tsx     # Vision Camera 3x3 grid motion detection + scoring
│   │   ├── PostAlarmModal.tsx     # Post-dance modal (Save/Share/Skip)
│   │   └── ShareCard.tsx          # Branded share card (score + comment)
│   │
│   ├── screens/
│   │   ├── AlarmTriggerScreen.tsx # Motion detection + countdown + live score
│   │   ├── DashboardScreen.tsx    # Alarm list (main screen)
│   │   ├── OnboardingScreen.tsx   # 3-screen welcome flow
│   │   ├── PaywallScreen.tsx      # $2.99 lifetime Pro purchase
│   │   ├── PrivacyScreen.tsx      # Privacy policy
│   │   ├── SuccessScreen.tsx      # Celebration with score + confetti
│   │   └── TermsScreen.tsx        # Terms of service
│   │
│   ├── navigation/
│   │   └── RootNavigator.tsx      # Stack navigator + notifee event listener
│   │
│   └── lib/
│       ├── api.ts                 # Backend API client
│       ├── config.ts              # App configuration (RevenueCat keys, API URL)
│       ├── notifications.ts       # Alarm scheduling (@notifee/react-native)
│       ├── purchases.ts           # RevenueCat ($2.99 lifetime purchase)
│       └── store.ts               # Zustand state management
│
└── assets/
    ├── fonts/                     # Orbitron, Rajdhani, ShareTechMono
    └── sounds/                    # alarm.mp3, dance.mp3
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.73 (bare CLI) |
| Language | TypeScript |
| Navigation | React Navigation (native stack) |
| State | Zustand + TanStack React Query |
| Camera | react-native-vision-camera |
| Audio | react-native-sound |
| Notifications | @notifee/react-native |
| Haptics | react-native-haptic-feedback |
| Payments | RevenueCat (react-native-purchases) |
| Sharing | react-native-share |
| Camera Roll | @react-native-camera-roll/camera-roll |
| File System | react-native-fs |
| Share Card | react-native-view-shot |
| Keep Awake | react-native-keep-awake |
| Styling | StyleSheet (dark neon theme) |
| Fonts | Orbitron, Rajdhani, Share Tech Mono |

---

## Configuration

### RevenueCat (In-App Purchase)
Update `src/lib/config.ts` with your RevenueCat API keys:
```typescript
export const REVENUECAT_API_KEYS = {
  ios: 'appl_YOUR_ACTUAL_KEY',
  android: 'goog_YOUR_ACTUAL_KEY',
};
```

### Backend API
Update `src/lib/config.ts` with your backend URL.

---

## Company

**Kalopsia Labs**
Support: support@kalopsialabs.com

## License

Proprietary - Kalopsia Labs 2026
