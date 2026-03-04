# Groove Alarm

> The alarm clock that makes you dance to wake up!

[![Expo](https://img.shields.io/badge/Expo-50-000020?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-61DAFB?logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## About

Groove Alarm is a unique alarm clock app that requires you to physically dance to dismiss your alarms. Using your phone's front camera, the app detects motion across a 3x3 grid and won't stop ringing until you've danced for the required duration. After dancing, you get a score (0-100) with a funny comment and can share a branded video card to social media.

### Features

- **Motion Detection** - Camera-based 3x3 grid movement tracking with anti-cheat
- **Movement Scoring** - Score 0-100 based on intensity, consistency, zone variety, and peak movement
- **Funny Comments** - Score-based reactions like "Beyonce called, she's worried" (95-100)
- **Branded Share Cards** - Dark neon share card with score, comment, and app branding
- **Video Export** - Save dance videos to camera roll
- **Native Share Sheet** - Share to TikTok, Instagram, WhatsApp, etc.
- **Native Alarms** - True alarm audio that bypasses Do Not Disturb (Android)
- **Dual Audio Crossfade** - Alarm ringtone fades to dance music when you start moving
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

## Scoring System

Movement is scored 0-100 based on:
- **Intensity** (40%): Average motion intensity across frames
- **Consistency** (35%): Percentage of frames where user was actively dancing
- **Zone Variety** (15%): How many of the 3x3 grid zones were activated
- **Peak Bonus** (10%): Maximum single-frame intensity

Score comments:
| Score | Comment |
|-------|---------|
| 95-100 | "Beyonce called, she's worried" |
| 80-94 | "Not bad for someone half asleep" |
| 60-79 | "The vibes were there... barely" |
| 40-59 | "Your bed is judging you right now" |
| 20-39 | "Was that dancing or a cry for help?" |
| 0-19 | "We've seen better movement from a statue" |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/build/setup/) (for building APK/iOS)
- Physical device with [Expo Go](https://expo.dev/client) or emulator

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/groove-alarm.git
cd groove-alarm

npm install

# Start the development server
npm start
```

### Running on Device

**Expo Go (Quick testing)**
1. Install Expo Go on your phone
2. Run `npm start`
3. Scan the QR code

**Native Build (Full features)**
```bash
# Generate native projects
npx expo prebuild --clean

# Android
npm run android

# iOS (Mac only)
cd ios && pod install && cd ..
npm run ios
```

---

## Building for Production

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed build instructions including APK, AAB, and iOS builds.

### Quick Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build APK for testing
eas build --platform android --profile preview

# Build for App Store
eas build --platform ios --profile production

# Build for Play Store
eas build --platform android --profile production
```

---

## Project Structure

```
groove-alarm/
├── App.tsx                        # App entry point (fonts, navigation)
├── app.json                       # Expo configuration
├── eas.json                       # EAS Build profiles
├── package.json                   # Dependencies
│
├── src/
│   ├── components/
│   │   ├── AlarmCard.tsx          # Alarm list item with Pro badges
│   │   ├── Badge.tsx              # Status badges
│   │   ├── Button.tsx             # Custom neon button
│   │   ├── Card.tsx               # Card container
│   │   ├── CreateAlarmModal.tsx   # Alarm creation (15s free / Pro durations)
│   │   ├── MotionDetector.tsx     # Camera 3x3 grid motion detection + scoring
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
│   │   └── RootNavigator.tsx      # Stack navigator + notification listener
│   │
│   └── lib/
│       ├── api.ts                 # Backend API client
│       ├── notifications.ts       # Alarm scheduling (expo-notifications)
│       ├── purchases.ts           # RevenueCat ($2.99 lifetime purchase)
│       └── store.ts               # Zustand state management
│
└── assets/
    ├── fonts/                     # Orbitron, Rajdhani, ShareTechMono
    └── sounds/                    # alarm.mp3, dance.mp3
```

---

## App Flow

1. **Onboarding** (first launch only) - 3 screens: intro, camera permission, setup tips
2. **Paywall** - $2.99 lifetime Pro upsell (dismissible)
3. **Dashboard** - Alarm list with create/edit/delete/toggle
4. **Alarm Trigger** - Full-screen camera with motion detection, live scoring, countdown
5. **Post-Alarm Modal** - Score + funny comment + Save Video / Share Now / Skip
6. **Success** - Confetti celebration with final score

---

## Configuration

### RevenueCat (In-App Purchase)
Update `app.json` with your RevenueCat API keys:
```json
{
  "extra": {
    "revenueCatApiKeyIos": "your_ios_api_key",
    "revenueCatApiKeyAndroid": "your_android_api_key"
  }
}
```

### Backend API
Update the API URL in `src/lib/api.ts` for your backend server.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.73 + Expo 50 |
| Language | TypeScript |
| Navigation | React Navigation (native stack) |
| State | Zustand + TanStack React Query |
| Camera | expo-camera |
| Audio | expo-av (dual-track crossfade) |
| Notifications | expo-notifications |
| Payments | RevenueCat (react-native-purchases) |
| Sharing | expo-sharing + expo-media-library |
| Share Card | react-native-view-shot |
| Styling | StyleSheet (dark neon theme) |
| Fonts | Orbitron, Rajdhani, Share Tech Mono |

---

## Company

**Kalopsia Labs**
Support: support@kalopsialabs.com

## License

Proprietary - Kalopsia Labs 2026
