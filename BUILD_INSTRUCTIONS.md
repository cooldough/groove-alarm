# Groove Alarm - Complete Build Instructions

This document provides step-by-step instructions for building the Groove Alarm React Native (Expo) app for Android (APK/AAB) and iOS (IPA). Follow these instructions exactly to produce working builds.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Configuration](#3-configuration)
4. [Build APK (Android)](#4-build-apk-android)
5. [Build iOS App](#5-build-ios-app)
6. [Local Builds (Without EAS)](#6-local-builds-without-eas)
7. [App Flow Reference](#7-app-flow-reference)
8. [Complete UI Reference](#8-complete-ui-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

### Required Tools
```bash
# Node.js 18+
node --version

# Install Expo CLI and EAS CLI globally
npm install -g expo-cli eas-cli

# Login to Expo account (create one at https://expo.dev)
eas login

# For local Android builds: Android Studio with SDK 34+
# For local iOS builds: Xcode 15+ (Mac only) with CocoaPods
```

### Required Accounts
- **Expo Account**: https://expo.dev (free, required for EAS Build)
- **RevenueCat Account**: https://app.revenuecat.com (for in-app purchases, optional for testing)
- **Apple Developer Account**: https://developer.apple.com ($99/year, required for iOS builds)
- **Google Play Console**: https://play.google.com/console ($25 one-time, required for Play Store)

---

## 2. Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/groove-alarm.git
cd groove-alarm

# Install dependencies
npm install

# Verify installation
npx expo doctor
```

### Important: The `ios/` and `android/` directories are NOT in the repo
They are generated automatically by `expo prebuild`. This is intentional — Expo regenerates them from `app.json` configuration.

```bash
# Generate native projects (REQUIRED before local builds)
npx expo prebuild --clean
```

This creates the `ios/` and `android/` directories with all correct naming (GrooveAlarm), bundle IDs (com.kalopsialabs.groovealarm), and permissions.

---

## 3. Configuration

### 3a. EAS Project Setup

```bash
# Initialize EAS for this project (first time only)
eas init

# This will create a project on Expo servers and update app.json with your project ID
```

After running `eas init`, update `app.json` → `extra.eas.projectId` with the generated project ID.

### 3b. RevenueCat (In-App Purchases)

1. Create a project at https://app.revenuecat.com
2. Add your app for iOS and Android
3. Create a "Lifetime" product ($2.99) in App Store Connect / Google Play Console
4. Get your API keys from RevenueCat dashboard
5. Update `app.json`:

```json
{
  "extra": {
    "revenueCatApiKeyIos": "appl_YOUR_ACTUAL_KEY",
    "revenueCatApiKeyAndroid": "goog_YOUR_ACTUAL_KEY"
  }
}
```

**Note:** The app works without RevenueCat keys — it runs in "demo mode" where purchases are simulated.

### 3c. App Icons & Splash Screen

Replace these placeholder files with your actual assets:
- `assets/icon.png` — App icon (1024x1024 PNG)
- `assets/adaptive-icon.png` — Android adaptive icon foreground (1024x1024 PNG)
- `assets/splash.png` — Splash screen (1284x2778 PNG recommended)
- `assets/notification-icon.png` — Android notification icon (96x96 PNG, white on transparent)
- `assets/favicon.png` — Web favicon (48x48 PNG)

### 3d. Audio Files

The app requires these audio files (already included):
- `assets/sounds/alarm.mp3` — Alarm ringtone (plays when not dancing)
- `assets/sounds/dance.mp3` — Dance music (crossfades in when dancing)

### 3e. Fonts

The app requires these fonts (already included in `assets/fonts/`):
- `Orbitron-Bold.ttf` — Headings and titles
- `Rajdhani-Regular.ttf` — Body text
- `Rajdhani-Bold.ttf` — Bold body text
- `ShareTechMono-Regular.ttf` — Code/timer display

---

## 4. Build APK (Android)

### Option A: EAS Build (Recommended - Cloud Build)

```bash
# Build APK for testing (installs directly on device)
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

After the build completes, EAS provides a download link for the APK/AAB.

### Option B: Local Build

```bash
# Generate native Android project
npx expo prebuild --clean

# Build debug APK
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

For a release APK:
```bash
# Generate a signing keystore (first time only)
keytool -genkeypair -v -storetype PKCS12 -keystore groove-alarm.keystore -alias groove-alarm -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Build iOS App

### Option A: EAS Build (Recommended)

```bash
# Build for iOS Simulator (no Apple Developer account needed)
eas build --platform ios --profile preview

# Build for App Store (requires Apple Developer account)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

### Option B: Local Build (Mac Only)

```bash
# Generate native iOS project
npx expo prebuild --clean

# Install CocoaPods
cd ios
pod install
cd ..

# Open in Xcode
open ios/GrooveAlarm.xcworkspace

# In Xcode:
# 1. Select your team under Signing & Capabilities
# 2. Select a connected device or simulator
# 3. Press Cmd+R to build and run
# 4. For archive: Product → Archive
```

---

## 6. Local Builds (Without EAS)

If you want to build entirely locally without EAS:

### Android Local Build
```bash
npx expo prebuild --clean
cd android
./gradlew assembleDebug       # Debug APK
./gradlew assembleRelease     # Release APK (needs signing)
./gradlew bundleRelease       # AAB for Play Store (needs signing)
```

### iOS Local Build
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
open ios/GrooveAlarm.xcworkspace
# Build from Xcode
```

---

## 7. App Flow Reference

This is the complete user flow — every screen and interaction:

### Screen 1: Onboarding (first launch only)
Three horizontal swipeable screens with dot indicators:
1. **"Stop Snoozing, Start Grooving"** — Intro with alarm icon, explains 15s dance concept
2. **"Motion Detection"** — Requests camera permission, shows live camera preview if granted
3. **"Ready to Wake Up?"** — Final screen with "Get Started" button

- Skip button (top-right) on all screens
- Completing onboarding → navigates to Paywall
- Sets `isFirstTimeUser = false` in AsyncStorage

### Screen 2: Paywall (shown once after onboarding, also accessible from Dashboard)
- Dark theme with crown icon
- Title: "GO PRO"
- Feature comparison table (Free vs Pro)
- Single price card: "$2.99 — LIFETIME DEAL"
- "Unlock Pro Forever — $2.99" button
- "Restore Purchases" link
- "Maybe Later" dismiss (X button top-right)
- Terms / Privacy links at bottom

### Screen 3: Dashboard (main screen)
- Header: "GROOVE ALARM" title with crown upgrade button (if not Pro)
- FlatList of alarm cards, each showing:
  - Time (HH:MM format)
  - Label
  - Toggle switch (enable/disable)
  - Edit/delete options
  - "PRO" badge on Pro features
- Empty state: "No alarms yet" message
- FAB (floating action button) bottom-right to create new alarm
- Pull-to-refresh

### Create Alarm Modal (from FAB)
- Time picker (hours : minutes input)
- Label text input
- Sounds section (Alarm Sound / Dance Sound tabs)
- Dance Duration picker:
  - Free: 15s only (others grayed out with PRO badge)
  - Pro: 15s / 30s / 1m / 1m30s / 2m / 2m30s / 3m
- Repeat days picker (Mon-Sun):
  - Free: disabled with PRO badge, "one-time only" hint
  - Pro: select multiple days
- Save / Cancel buttons

### Screen 4: Alarm Trigger (full-screen, gesture disabled)
- Title: "WAKE UP!" (changes to "KEEP DANCING!" when motion detected)
- Subtitle with encouragement text
- Live front camera preview (80% width square) with 3x3 grid overlay
  - Active zones glow cyan when motion detected
- Live score display: "SCORE 42" pill
- Countdown timer in circular ring (100px)
  - Ring color: cyan when dancing, pink when not
  - Timer pauses when not dancing
- Status text: "WAITING FOR MOTION" / "MOTION DETECTED"
- Audio: alarm.mp3 playing, crossfades to dance.mp3 when dancing
- Vibration pattern while alarm is active

### Post-Alarm Modal (after dance completes)
- Score emoji (based on range)
- "YOUR SCORE" label
- Large score number with /100 (cyan glow)
- Funny comment in quotes
- Branded Share Card preview:
  - Dark background with pink border
  - [LOGO] placeholder
  - "GROOVE ALARM" in Orbitron font
  - Score in large text with color coding
  - "/100" suffix
  - Funny comment
  - "Share your dance today" text
  - "Search Groove Alarm on the App Store & Google Play"
  - Stats row: duration danced + letter grade
- "Save Video" button (saves to camera roll)
- "Share Now" button (cyan, triggers native share sheet)
- "Skip" link (goes to Success screen)
- X close button (top-right)

### Screen 5: Success
- Confetti cannon animation (pink/cyan/yellow)
- Emoji icon (changes based on score range)
- "YOU DID IT!" title (cyan glow)
- "Alarm dismissed" subtitle
- Stats card: score + seconds danced
- Funny comment
- "Done" button → returns to Dashboard

---

## 8. Complete UI Reference

### Color Palette
- Background: `#0F0E17` (near-black)
- Surface: `#1A1A2E` (dark blue-gray)
- Border: `#3A3A50` (medium gray)
- Primary: `#FF00FF` (neon pink/magenta)
- Secondary: `#00FFFF` (cyan)
- Text Primary: `#FFFFFE` (white)
- Text Secondary: `#A0A0B0` (light gray)
- Gold accent: `#FFD700`

### Fonts
- **Orbitron** (Bold) — All titles, headings, timer numbers, score display
- **Rajdhani** (Regular + Bold) — Body text, descriptions, labels
- **Share Tech Mono** (Regular) — Status text, code-like displays

### Design Language
- Dark neon cyberpunk aesthetic
- Pink/magenta glow effects on titles (textShadow)
- Cyan glow for active/positive states
- Rounded corners (8-24px border radius)
- Card-based layouts with subtle borders

### Permissions Required
- Camera (front-facing, for motion detection)
- Notifications (for alarm scheduling)
- Media Library / Photo Library (for saving dance videos)
- Vibration
- Keep Awake (screen stays on during alarm)

---

## 9. Troubleshooting

### "Module not found" errors after clone
```bash
rm -rf node_modules
npm install
```

### expo prebuild fails
```bash
npx expo prebuild --clean    # --clean removes old native dirs first
```

### Camera not working in Expo Go
Some camera features require a native build. Use `npx expo run:android` or `npx expo run:ios` instead of Expo Go.

### Android build fails with "SDK not found"
Set `ANDROID_HOME` environment variable:
```bash
export ANDROID_HOME=$HOME/Android/Sdk    # Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # Mac
```

### iOS build fails with "No signing certificate"
In Xcode → Project Settings → Signing & Capabilities → select your team.

### RevenueCat "No API key configured"
This is normal in development. The app runs in demo mode. Set real keys in `app.json` for production.

### Fonts not loading
Fonts are loaded in `App.tsx` using `expo-font`. If fonts appear as system defaults, ensure:
1. Font files exist in `assets/fonts/`
2. Font names match exactly: `Orbitron-Bold.ttf`, `Rajdhani-Regular.ttf`, `Rajdhani-Bold.ttf`, `ShareTechMono-Regular.ttf`

### EAS Build fails with "project not initialized"
```bash
eas init          # Initialize project
eas build:configure  # Configure build profiles
```

### Audio not playing
- iOS: Ensure `playsInSilentModeIOS: true` is set (already configured in AlarmTriggerScreen)
- Android: Check that audio files exist in `assets/sounds/`

---

## Quick Reference Commands

```bash
# Development
npm start                              # Start Expo dev server
npx expo run:android                   # Run on Android device/emulator
npx expo run:ios                       # Run on iOS simulator (Mac only)

# Generate native projects
npx expo prebuild --clean              # Generate ios/ and android/ from app.json

# EAS Builds (cloud)
eas build --platform android --profile preview     # APK for testing
eas build --platform android --profile production  # AAB for Play Store
eas build --platform ios --profile preview         # iOS Simulator build
eas build --platform ios --profile production      # iOS App Store build

# Local Builds
cd android && ./gradlew assembleDebug              # Local Android debug APK
cd ios && pod install && cd .. && npm run ios       # Local iOS build

# Submit to stores
eas submit --platform android --profile production
eas submit --platform ios --profile production
```
