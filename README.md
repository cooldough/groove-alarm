# Groove Alarm

> The alarm clock that makes you dance to wake up!

**By Kalopsia Labs** | Bundle ID: `com.kalopsialabs.groovealarm` | Support: support@kalopsialabs.com

---

## What This App Does

Groove Alarm is a React Native CLI (bare, **NOT Expo**) alarm clock app. When an alarm fires, the user must physically dance in front of their phone's front camera to dismiss it. The app uses motion detection across a 3x3 grid to verify movement, scores the dance 0-100, records the dance as video, and lets users share branded score cards or their dance video to social media. Pro version ($2.99 lifetime, one-time purchase via RevenueCat) unlocks longer dance durations, repeat scheduling, video sharing, and all sounds.

---

## Critical Technical Context

- **This is a bare React Native CLI project** — there are NO Expo dependencies anywhere. Do not use `expo-*` packages.
- **React Native version**: 0.73
- **No `ios/` or `android/` directories in the repo** — these must be generated on a dev machine using `npx react-native init` and then the source files copied in, or by running the CLI setup.
- **Entry point**: `index.js` using `AppRegistry.registerComponent` (NOT `registerRootComponent` from Expo)
- **All styling uses `StyleSheet.create()`** — no NativeWind, no Tailwind, no styled-components
- **Fonts are linked natively** via `react-native.config.js` assets array + `npx react-native-asset`

---

## App Flow (Screen by Screen)

```
First Launch:
  OnboardingScreen (3 slides) → PaywallScreen ($2.99 upsell, dismissible) → DashboardScreen

Normal Use:
  DashboardScreen → [Create/Edit Alarm] → Alarm fires via @notifee →
  AlarmTriggerScreen (dance + motion detection + countdown + video recording) →
  PostAlarmModal (Share Dance Video, Save Video, Share Score Card, Skip) →
  SuccessScreen (celebration + confetti) → DashboardScreen
```

### Screen Details

1. **OnboardingScreen** (`src/screens/OnboardingScreen.tsx`)
   - 3 horizontal swipeable slides using FlatList
   - Slide 2 shows live camera preview (requests camera permission)
   - "SKIP" button top-right, circular "next" button bottom-right
   - On complete: sets `isFirstTimeUser = false` in Zustand, navigates to Paywall with `fromOnboarding: true`

2. **PaywallScreen** (`src/screens/PaywallScreen.tsx`)
   - Shows FREE vs PRO comparison table
   - Price: **$2.99 one-time lifetime** (NOT a subscription)
   - "Unlock Pro Forever — $2.99" button calls `purchaseLifetime()` from RevenueCat
   - "Restore Purchases" link
   - X close button: if `fromOnboarding`, navigates to Dashboard; otherwise goes back
   - Links to Privacy and Terms screens

3. **DashboardScreen** (`src/screens/DashboardScreen.tsx`)
   - Header: "GROOVE ALARM" title, Crown icon (upgrade button, hidden if Pro), Settings icon
   - FlatList of AlarmCard components with pull-to-refresh
   - Empty state: "No alarms yet" message
   - FAB (floating action button): pink circle with "+" icon, bottom-right
   - Opens CreateAlarmModal for new/edit alarms
   - Handles alarm CRUD via API (`src/lib/api.ts`) + TanStack React Query
   - Listens for `activeAlarmId` from Zustand to auto-navigate to AlarmTrigger when notification pressed

4. **AlarmTriggerScreen** (`src/screens/AlarmTriggerScreen.tsx`)
   - Receives `alarmId` and `duration` as route params
   - Shows MotionDetector component (camera + 3x3 grid overlay + video recording)
   - **Records the entire dance session as video** via Vision Camera `startRecording`/`stopRecording`
   - Live score display, countdown timer with progress ring
   - Status text: "MOTION DETECTED" (cyan) / "WAITING FOR MOTION" (gray)
   - Audio: alarm.mp3 plays on loop initially; when dancing detected, alarm fades to 20% and dance.mp3 plays at full volume
   - Timer only counts down while user is actively dancing
   - On complete: stops recording, receives video URI via `onVideoRecorded` callback, shows PostAlarmModal
   - Uses `KeepAwake.activate()` to prevent screen sleep

5. **PostAlarmModal** (`src/components/PostAlarmModal.tsx`)
   - Shows final score (0-100), funny comment, emoji
   - Contains ShareCard component (branded card with Groove Alarm logo in bottom-right corner)
   - **"Share Dance Video"** button (cyan) — shares recorded dance video via native share sheet
   - **"Save Video to Camera Roll"** button — saves video to camera roll via CameraRoll
   - **"Share Score Card"** button (magenta outline) — captures ShareCard as PNG and shares via native share sheet
   - **"Skip"** link — dismisses without sharing
   - On close: navigates to SuccessScreen
   - Video buttons only appear when a video was successfully recorded

6. **SuccessScreen** (`src/screens/SuccessScreen.tsx`)
   - Confetti animation (react-native-confetti-cannon)
   - "YOU DID IT!" with score and duration stats
   - Funny comment in quotes
   - "Done" button returns to Dashboard

7. **PrivacyScreen** / **TermsScreen** — static legal text with back navigation

---

## Navigation Architecture

File: `src/navigation/RootNavigator.tsx`

```typescript
type RootStackParamList = {
  Onboarding: undefined;
  Paywall: { fromOnboarding?: boolean };
  Dashboard: undefined;
  AlarmTrigger: { alarmId: number; duration: number };
  Success: { duration: number; score: number; comment: string };
  Privacy: undefined;
  Terms: undefined;
};
```

- Uses `@react-navigation/native-stack`
- `headerShown: false` globally, background `#0F0E17`, fade animation
- Conditional rendering: if `isFirstTimeUser` is true, Onboarding + Paywall screens appear first; otherwise Dashboard is initial screen
- Paywall screen registered once for first-time users (inside the conditional block) and once for returning users (outside it)
- Foreground notification listener: when alarm notification is pressed, sets `activeAlarmId` in Zustand store → Dashboard picks it up and navigates to AlarmTrigger

---

## Key Components

### MotionDetector (`src/components/MotionDetector.tsx`)

The core of the app. Handles both motion detection AND video recording simultaneously.

**Motion Detection — how it works:**

1. Uses `react-native-vision-camera` with `useCameraDevice('front')` and `useCameraPermission()`
2. Camera is configured with `photo={true}`, `video={true}`, `audio={false}`
3. Every 100ms (`CAPTURE_INTERVAL`), takes a photo with `cameraRef.current.takePhoto({ qualityPrioritization: 'speed' })`
4. Reads the photo as base64 via `RNFS.readFile(photo.path, 'base64')`
5. Deletes the temp photo file immediately: `RNFS.unlink(photo.path)`
6. Splits the base64 data into 9 zones (3x3 grid), sampling every 100th byte
7. Compares current frame zones against previous frame zones
8. If average pixel difference in a zone exceeds `MOTION_THRESHOLD` (30), that zone is "active"
9. If `MIN_ACTIVE_ZONES` (3) or more zones are active, the user is "dancing"
10. Triggers haptic feedback (`impactLight`) when dancing is detected

**Video Recording — how it works:**

1. When `shouldRecord={true}` and camera is ready, calls `cameraRef.current.startRecording()`
2. Recording runs continuously in the background while motion detection photos are captured
3. When `isActive` becomes false (dance session complete), calls `cameraRef.current.stopRecording()`
4. `onRecordingFinished` callback receives a `VideoFile` with the `.path` to the recorded video
5. The video path is passed up via `onVideoRecorded` callback to AlarmTriggerScreen
6. Audio is disabled (`audio={false}`) — the video captures the visual dance only, no microphone needed

**Scoring Algorithm** (0-100):
- **Intensity** (40 pts): Average motion intensity across all frames, normalized to 80 max
- **Consistency** (35 pts): Ratio of frames where dancing was detected
- **Variety** (15 pts): Average number of active zones per frame, normalized to 6 max
- **Peak Bonus** (10 pts): Highest single-frame intensity, normalized to 120 max

**Score Comments**:
| Score Range | Comment |
|-------------|---------|
| 95-100 | "Beyonce called, she's worried" |
| 80-94 | "Not bad for someone half asleep" |
| 60-79 | "The vibes were there... barely" |
| 40-59 | "Your bed is judging you right now" |
| 20-39 | "Was that dancing or a cry for help?" |
| 0-19 | "We've seen better movement from a statue" |

**Props**:
```typescript
interface MotionDetectorProps {
  onDancing: (isDancing: boolean) => void;
  onScoreUpdate?: (score: number) => void;
  onSessionComplete?: (finalScore: number, comment: string) => void;
  onVideoRecorded?: (videoUri: string) => void;
  isActive: boolean;
  shouldRecord?: boolean;
}
```

**Usage in AlarmTriggerScreen:**
```typescript
<MotionDetector
  onDancing={setIsDancing}
  onScoreUpdate={handleScoreUpdate}
  onVideoRecorded={handleVideoRecorded}  // receives video file path
  isActive={!isComplete}
  shouldRecord={true}
/>
```

### ShareCard (`src/components/ShareCard.tsx`)

Branded share card that gets captured as a PNG image for social sharing.

- Uses `react-native-view-shot` (`ViewShot`) to capture the card as a PNG
- Dark card (`#0F0E17`) with magenta border (`#FF00FF`)
- Layout from top to bottom:
  - "I WOKE UP DANCING" header label (gray, letter-spaced)
  - Score emoji (fire/dancer/disco/sweat/grimace/statue based on score)
  - Large score number in Orbitron font, color-coded: >=80 cyan, >=60 green, >=40 gold, >=20 orange, <20 red
  - "/100" suffix in gray
  - Funny comment in quotes (white, italic)
  - Stats row: duration danced + letter grade (A+/B/C/D) in dark surface pill
  - Divider line
  - "Can you beat my score?" call-to-action (cyan)
  - App store search text (gray)
  - **Groove Alarm logo in bottom-right corner**: small magenta circle with music note icon + "GROOVE ALARM" text + "by Kalopsia Labs" subtitle, aligned to `flex-end`
- Exposed via `forwardRef` with `ShareCardHandle.capture()` method that returns the PNG file path

### PostAlarmModal (`src/components/PostAlarmModal.tsx`)

Post-dance modal with four distinct actions:

1. **"Share Dance Video"** (cyan button, `testID="button-share-video"`) — only shown when `videoUri` exists. Opens native share sheet with the recorded dance video (mp4).
2. **"Save Video to Camera Roll"** (outline button, `testID="button-save-video"`) — only shown when `videoUri` exists. Saves via `CameraRoll.saveAsset(videoUri, { type: 'video' })`. Shows "Saved!" text after success.
3. **"Share Score Card"** (magenta outline button, `testID="button-share-card"`) — always shown. Captures the ShareCard component as a PNG via `shareCardRef.current.capture()` and opens native share sheet with the image.
4. **"Skip"** (underlined text link, `testID="button-skip"`) — dismisses the modal.

Share message format: `I scored ${score}/100 dancing to dismiss my alarm! "${comment}" - Groove Alarm`

Score emojis: 95+ fire, 80+ dancer, 60+ disco, 40+ sweat, 20+ grimace, <20 statue

### AlarmCard (`src/components/AlarmCard.tsx`)

- Uses Card and Badge subcomponents
- Displays time (12h format), label, day badges, duration badge
- "PRO" badge shown for durations > 30s when not premium
- Toggle switch, edit and delete buttons

### CreateAlarmModal (`src/components/CreateAlarmModal.tsx`)

- Time input: two TextInput fields for hours and minutes
- Label text input
- Day selector: 7 buttons (Sun-Sat), disabled for free users (shows "PRO" badge)
- Duration selector: [15, 30, 60, 90, 120, 150, 180] seconds — only 15s for free users
- Free users forced to `isOneTime: true` and `duration: 15`

### Button (`src/components/Button.tsx`)

- Variants: `primary` (magenta), `secondary` (dark), `ghost` (transparent), `outline` (magenta border)
- Sizes: `sm`, `md`, `lg`
- Haptic feedback (`impactLight`) on every press
- Loading state with ActivityIndicator

---

## Library-Specific Implementation Patterns

### react-native-vision-camera (Camera + Video Recording)

```typescript
import { Camera, useCameraDevice, useCameraPermission, PhotoFile, VideoFile } from 'react-native-vision-camera';

const device = useCameraDevice('front');
const { hasPermission, requestPermission } = useCameraPermission();

// In JSX — photo AND video enabled, no audio:
<Camera ref={cameraRef} style={styles.camera} device={device} isActive={isActive}
  photo={true} video={true} audio={false} />

// Photo capture (for motion detection):
const photo: PhotoFile = await cameraRef.current.takePhoto({ qualityPrioritization: 'speed' });
const base64 = await RNFS.readFile(photo.path, 'base64');
RNFS.unlink(photo.path).catch(() => {});

// Video recording (for dance session capture):
cameraRef.current.startRecording({
  onRecordingFinished: (video: VideoFile) => {
    onVideoRecorded?.(video.path);  // Pass video path to parent
  },
  onRecordingError: (error) => {
    console.error('Recording error:', error);
  },
});

// Stop recording:
await cameraRef.current.stopRecording();
```

### react-native-sound (Audio)

```typescript
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const sound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) return;
  sound.setNumberOfLoops(-1);  // Loop forever
  sound.setVolume(1.0);
  sound.play();
});

// Control:
sound.setVolume(0.2);  // Fade
sound.pause();
sound.stop();
sound.release();       // Must call when done
```

### @notifee/react-native (Notifications & Alarms)

```typescript
import notifee, { AndroidImportance, AndroidVisibility, TriggerType, TimestampTrigger, EventType } from '@notifee/react-native';

// Setup (in App.tsx useEffect):
await notifee.requestPermission();
await notifee.createChannel({
  id: 'alarms',
  name: 'Alarms',
  importance: AndroidImportance.HIGH,
  sound: 'alarm',
  bypassDnd: true,
  visibility: AndroidVisibility.PUBLIC,
});

// Schedule alarm:
const trigger: TimestampTrigger = {
  type: TriggerType.TIMESTAMP,
  timestamp: date.getTime(),
  alarmManager: { allowWhileIdle: true },
};
const id = await notifee.createTriggerNotification({
  title: 'Groove Alarm',
  body: label,
  data: { alarmId: String(alarmId), type: 'alarm' },
  android: { channelId: 'alarms', fullScreenAction: { id: 'default' }, pressAction: { id: 'default' } },
  ios: { sound: 'alarm.mp3', critical: true, criticalVolume: 1.0 },
}, trigger);

// Background handler (in index.js):
import { onBackgroundEvent } from './src/lib/notifications';
onBackgroundEvent(({ type, detail }) => { /* handle */ });

// Foreground handler (in RootNavigator.tsx):
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) { /* navigate to alarm */ }
});
```

### react-native-haptic-feedback

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

ReactNativeHapticFeedback.trigger('impactLight');       // Button press
ReactNativeHapticFeedback.trigger('notificationSuccess'); // Alarm complete
ReactNativeHapticFeedback.trigger('notificationWarning'); // Pro feature blocked
```

### react-native-keep-awake

```typescript
import KeepAwake from 'react-native-keep-awake';

KeepAwake.activate();    // Prevent screen sleep
KeepAwake.deactivate();  // Allow screen sleep again
```

### react-native-share

```typescript
import Share from 'react-native-share';

await Share.open({
  title: `I scored ${score}/100 on Groove Alarm!`,
  message: `I scored ${score}/100 on Groove Alarm! "${comment}"`,
  url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
  type: isVideo ? 'video/mp4' : 'image/png',
});
```

### @react-native-camera-roll/camera-roll

```typescript
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
await CameraRoll.saveAsset(videoUri, { type: 'video' });
```

### RevenueCat (react-native-purchases)

```typescript
import Purchases from 'react-native-purchases';

// Initialize (App.tsx):
await Purchases.configure({ apiKey: getRevenueCatApiKey() });

// Purchase lifetime:
const offerings = await Purchases.getOfferings();
const lifetimePackage = offerings.current?.lifetime;
const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);
const isPro = customerInfo.entitlements.active['pro'] !== undefined;

// Restore:
const customerInfo = await Purchases.restorePurchases();
```

The entitlement name is `'pro'`. The package type is `lifetime` (one-time $2.99, not a subscription).

---

## State Management

### Zustand Store (`src/lib/store.ts`)

```typescript
interface AppState {
  isFirstTimeUser: boolean;    // Controls onboarding flow
  isPremium: boolean;          // Controls Pro feature gating
  activeAlarmId: number | null; // Set when notification pressed, triggers navigation
}
```

Persisted to `@react-native-async-storage/async-storage`:
- `firstTimeUser` — JSON boolean
- `isPremium` — JSON boolean

### TanStack React Query

Used for alarm CRUD operations:
- `queryKey: ['alarms']` for fetching alarms
- Mutations invalidate `['alarms']` on success
- `staleTime: 5 minutes`, `retry: 2`

---

## API Client (`src/lib/api.ts`)

```typescript
interface Alarm {
  id: number;
  time: string;           // "HH:MM" format (24h)
  label: string;
  isActive: boolean;
  days: number[];          // 0=Sun, 1=Mon, ..., 6=Sat
  soundId: number;
  danceSoundId: number;
  customAlarmSound: string | null;
  customDanceSound: string | null;
  isSnoozeEnabled: boolean;
  duration: number;        // seconds (15, 30, 60, 90, 120, 150, 180)
  isOneTime: boolean;
}

// Endpoints (relative to API_CONFIG.baseUrl):
GET    /alarms          → Alarm[]
POST   /alarms          → Alarm (body: Omit<Alarm, 'id'>)
PATCH  /alarms/:id      → Alarm (body: Partial<Alarm>)
DELETE /alarms/:id      → void
GET    /sounds          → Sound[]
```

API base URL configured in `src/lib/config.ts`:
- Dev: `http://localhost:5000/api`
- Prod: `https://your-app-url.replit.app/api`

---

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0F0E17` | All screen backgrounds |
| Surface | `#1A1A2E` | Cards, inputs, elevated elements |
| Border | `#3A3A50` | Card borders, dividers |
| Primary | `#FF00FF` | Magenta — buttons, accents, alarm time, branding |
| Accent | `#00FFFF` | Cyan — active states, dancing indicator, score |
| Text Primary | `#FFFFFE` | Main text |
| Text Secondary | `#A0A0B0` | Subtitles, labels, muted text |
| Success Green | `#00FF80` | Score 60-79 color |
| Warning Gold | `#FFD700` | Score 40-59, lifetime badge |
| Danger Red | `#FF4444` | Delete icon |
| Score Red | `#FF0040` | Score <20 |
| Score Orange | `#FF8000` | Score 20-39 |

### Fonts

| Font | Family Name | Usage |
|------|-------------|-------|
| Orbitron-Bold.ttf | `Orbitron` | Headings, scores, time display, app branding |
| Rajdhani-Regular.ttf | `Rajdhani` | Body text, descriptions, labels |
| Rajdhani-Bold.ttf | `Rajdhani-Bold` | Emphasized body text, buttons, section titles |
| ShareTechMono-Regular.ttf | `ShareTechMono` | Status text, monospace elements |

Fonts are in `assets/fonts/` and linked via `react-native.config.js`:
```javascript
module.exports = {
  project: { ios: { sourceDir: './ios' }, android: { sourceDir: './android' } },
  assets: ['./assets/fonts', './assets/sounds'],
};
```

### Common Style Patterns

```typescript
// Glow effect on headings
textShadowColor: '#FF00FF',
textShadowOffset: { width: 0, height: 0 },
textShadowRadius: 10,

// Neon border card
backgroundColor: '#1A1A2E',
borderRadius: 12,
borderWidth: 1,
borderColor: '#3A3A50',

// FAB (floating action button)
position: 'absolute',
bottom: 30,
right: 20,
width: 64,
height: 64,
borderRadius: 32,
backgroundColor: '#FF00FF',
shadowColor: '#FF00FF',
shadowOpacity: 0.5,
shadowRadius: 8,
elevation: 8,
```

---

## Free vs Pro Feature Gating

| Feature | Free | Pro |
|---------|------|-----|
| Dance Duration | 15s only | 15s, 30s, 60s, 90s, 120s, 150s, 180s |
| Repeat Days | One-time only (forced `isOneTime: true`) | Mon-Sun scheduling |
| Sounds | 2 basic | All premium sounds |
| Alarms | Unlimited | Unlimited |
| Sharing | Score card only | Video + score sharing |

Gating is done in `CreateAlarmModal`:
- Duration selector: only 15s clickable for free users, others show disabled opacity + haptic warning
- Day selector: all disabled for free users + haptic warning, "PRO" badge shown
- On save: free users forced to `duration: 15`, `isOneTime: true`

Pro status checked via `useAppStore().isPremium` (Zustand, persisted to AsyncStorage).

---

## Assets

```
assets/
├── fonts/
│   ├── Orbitron-Bold.ttf
│   ├── Rajdhani-Bold.ttf
│   ├── Rajdhani-Regular.ttf
│   └── ShareTechMono-Regular.ttf
├── sounds/
│   ├── alarm.mp3            # Alarm ringtone (loops)
│   └── dance.mp3            # Dance music (loops, plays when dancing)
├── adaptive-icon.png
├── favicon.png
├── icon.png
├── notification-icon.png
└── splash.png
```

Sounds are loaded via `react-native-sound` from `Sound.MAIN_BUNDLE` after being linked by `npx react-native-asset`.

---

## Configuration Files

### package.json — Dependencies

```json
{
  "dependencies": {
    "@notifee/react-native": "^7.8.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-camera-roll/camera-roll": "^7.4.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@tanstack/react-query": "^5.17.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-confetti-cannon": "^1.5.2",
    "react-native-fs": "^2.20.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-haptic-feedback": "^2.2.0",
    "react-native-keep-awake": "^4.0.0",
    "react-native-purchases": "^7.0.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-native-share": "^10.0.0",
    "react-native-sound": "^0.11.2",
    "react-native-svg": "14.1.0",
    "react-native-view-shot": "^3.8.0",
    "react-native-vision-camera": "^3.9.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/babel-preset": "^0.73.0",
    "@react-native/metro-config": "^0.73.0",
    "@react-native/typescript-config": "^0.73.0",
    "@types/react": "~18.2.45",
    "metro-react-native-babel-preset": "^0.77.0",
    "typescript": "^5.1.3"
  }
}
```

### babel.config.js

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

### metro.config.js

```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const config = {};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### app.json

```json
{
  "name": "GrooveAlarm",
  "displayName": "Groove Alarm"
}
```

### index.js (Entry Point)

```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { onBackgroundEvent } from './src/lib/notifications';

onBackgroundEvent(({ type, detail }) => {
  console.log('Background notification event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- React Native CLI (`npx react-native`)
- Android Studio with SDK 34+ (for Android)
- Xcode 15+ with CocoaPods (for iOS, Mac only)

### Installation

```bash
git clone https://github.com/cooldough/groove-alarm.git
cd groove-alarm
npm install
npx react-native-asset       # Link fonts and sounds natively
cd ios && pod install && cd ..  # iOS only
```

### Generate Native Projects (if missing)

The `ios/` and `android/` directories are not committed to the repo. To generate them:

```bash
# Option 1: Use react-native init to create a fresh project, then copy src files in
npx react-native init GrooveAlarm --version 0.73.0
# Copy src/, assets/, config files into the generated project

# Option 2: If native dirs already exist from a previous setup
cd ios && pod install && cd ..
npx react-native-asset
```

### Running

```bash
npm start              # Start Metro bundler
npm run android        # Run on Android
npm run ios            # Run on iOS (Mac only)
```

### Building for Production

```bash
# Android
cd android && ./gradlew assembleRelease    # APK
cd android && ./gradlew bundleRelease      # AAB for Play Store

# iOS
open ios/GrooveAlarm.xcworkspace
# Xcode → Product → Archive → Distribute
```

### Required Android Permissions

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Required iOS Permissions

Add to `ios/GrooveAlarm/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Groove Alarm needs camera access to detect your dance moves</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save your dance videos to your camera roll</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Access your photo library to save dance videos</string>
```

---

## File Reference (Every Source File)

| File | Purpose |
|------|---------|
| `index.js` | Entry point — registers app component + notifee background handler |
| `App.tsx` | Root component — providers (GestureHandler, SafeArea, QueryClient, Navigation), StatusBar, KeepAwake, initializes notifications + RevenueCat |
| `src/navigation/RootNavigator.tsx` | Stack navigator with conditional onboarding, foreground notification listener |
| `src/screens/OnboardingScreen.tsx` | 3-slide FlatList intro, camera preview on slide 2, requests camera permission |
| `src/screens/PaywallScreen.tsx` | $2.99 lifetime Pro purchase UI, free vs pro comparison, restore purchases |
| `src/screens/DashboardScreen.tsx` | Main alarm list, CRUD operations, FAB for creating alarms, auto-navigate on notification press |
| `src/screens/AlarmTriggerScreen.tsx` | Full-screen dance detection, countdown timer, dual audio crossfade, post-alarm modal |
| `src/screens/SuccessScreen.tsx` | Celebration with confetti, score display, "Done" button |
| `src/screens/PrivacyScreen.tsx` | Static privacy policy text |
| `src/screens/TermsScreen.tsx` | Static terms of service text |
| `src/components/MotionDetector.tsx` | Vision Camera 3x3 grid motion detection + video recording, frame comparison, scoring algorithm |
| `src/components/PostAlarmModal.tsx` | Post-dance modal: Share Dance Video, Save Video, Share Score Card, Skip |
| `src/components/ShareCard.tsx` | Branded share card with Groove Alarm logo in bottom-right corner, captured via ViewShot |
| `src/components/AlarmCard.tsx` | Individual alarm display with toggle, edit, delete, Pro badges |
| `src/components/CreateAlarmModal.tsx` | Alarm creation/edit form with Pro gating on duration and repeat days |
| `src/components/Button.tsx` | Reusable button with variants, sizes, haptic feedback, loading state |
| `src/components/Card.tsx` | Simple card container (dark surface + border) |
| `src/components/Badge.tsx` | Small badge component (primary/accent/muted variants) |
| `src/lib/config.ts` | App config: name, version, bundleId, RevenueCat API keys, API base URL |
| `src/lib/notifications.ts` | Notifee alarm scheduling, channel creation, foreground/background event wrappers |
| `src/lib/purchases.ts` | RevenueCat initialization, purchase lifetime, restore, check premium status |
| `src/lib/api.ts` | REST API client for alarm CRUD and sounds |
| `src/lib/store.ts` | Zustand store with AsyncStorage persistence (isFirstTimeUser, isPremium, activeAlarmId) |

---

## License

Proprietary — Kalopsia Labs 2026
