# Groove Alarm - Build Instructions (React Native CLI)

This project uses **bare React Native CLI** (not Expo). All native code is managed directly.

---

## Prerequisites

```bash
node --version          # Node.js 18+
npx react-native --version  # React Native CLI

# Android: Android Studio + SDK 34+ + Java 17+
# iOS (Mac only): Xcode 15+ + CocoaPods
```

---

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/groove-alarm.git
cd groove-alarm

npm install

# Link font and sound assets to native projects
npx react-native-asset

# iOS only
cd ios && pod install && cd ..
```

---

## Development

```bash
# Start Metro bundler
npm start

# Run on Android device/emulator
npm run android

# Run on iOS simulator (Mac only)
npm run ios
```

---

## Android Build

### Debug APK
```bash
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (needs signing)
```bash
# Generate signing keystore (first time)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/groove-alarm.keystore \
  -alias groove-alarm -keyalg RSA -keysize 2048 -validity 10000

# Add to android/gradle.properties:
# MYAPP_RELEASE_STORE_FILE=groove-alarm.keystore
# MYAPP_RELEASE_KEY_ALIAS=groove-alarm
# MYAPP_RELEASE_STORE_PASSWORD=your_password
# MYAPP_RELEASE_KEY_PASSWORD=your_password

cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### AAB for Play Store
```bash
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## iOS Build

```bash
cd ios && pod install && cd ..
open ios/GrooveAlarm.xcworkspace
```

In Xcode:
1. Select your team under Signing & Capabilities
2. Select target device or simulator
3. Product → Run (Cmd+R) for debug
4. Product → Archive for App Store submission

---

## Native Configuration

### Android (android/)
- **Package**: `com.kalopsialabs.groovealarm`
- **Permissions**: Camera, exact alarms, vibrate, media storage
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34

### iOS (ios/)
- **Bundle ID**: `com.kalopsialabs.groovealarm`
- **Permissions**: Camera, notifications, photo library
- **Deployment target**: iOS 14.0
- **Background modes**: Audio, fetch, remote-notification

### Fonts (linked via react-native-asset)
- `Orbitron-Bold.ttf`
- `Rajdhani-Regular.ttf`
- `Rajdhani-Bold.ttf`
- `ShareTechMono-Regular.ttf`

### Sounds (linked via react-native-asset)
- `alarm.mp3`
- `dance.mp3`

---

## RevenueCat Setup

1. Create project at https://app.revenuecat.com
2. Add iOS/Android apps
3. Create "Lifetime" product ($2.99) in App Store Connect / Google Play Console
4. Get API keys → update `src/lib/config.ts`

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| react-native-vision-camera | Front camera for motion detection |
| @notifee/react-native | Alarm scheduling + notifications |
| react-native-sound | Audio playback (alarm + dance music) |
| react-native-haptic-feedback | Haptic feedback on interactions |
| react-native-keep-awake | Prevent screen sleep during alarm |
| react-native-purchases | RevenueCat in-app purchases |
| react-native-share | Native share sheet |
| @react-native-camera-roll/camera-roll | Save videos to gallery |
| react-native-fs | File system operations |
| react-native-view-shot | Capture share card as image |

---

## Troubleshooting

### Metro bundler won't start
```bash
npx react-native start --reset-cache
```

### Android build fails
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### iOS pod install fails
```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

### Fonts not showing
```bash
npx react-native-asset    # Re-link assets
cd ios && pod install && cd ..
```

### Camera not working
- Ensure camera permissions are granted
- react-native-vision-camera requires a physical device (not simulator)

### Sounds not playing
- Ensure sound files are in `assets/sounds/`
- Run `npx react-native-asset` to link them
- On iOS: check Audio Session category is set to Playback
