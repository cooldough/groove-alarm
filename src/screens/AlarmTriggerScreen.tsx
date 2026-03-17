import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Sound from 'react-native-sound';
import KeepAwake from 'react-native-keep-awake';
import { X, AlertCircle, Music } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

import MotionDetector, { MotionDetectorHandle } from '../components/MotionDetector';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppStore } from '../lib/store';
import { calculateScore } from '../lib/motionScorer';
import type { FrameData } from '../lib/motionScorer';
import {
  ALARM_SOUNDS,
  DANCE_SOUNDS,
  CUSTOM_SOUND_ID,
  getSoundFilename,
  getDefaultAlarmSoundId,
  getDefaultDanceSoundId,
} from '../lib/sounds';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlarmTrigger'>;
type AlarmTriggerRouteProp = RouteProp<RootStackParamList, 'AlarmTrigger'>;

const { width, height } = Dimensions.get('window');
const RING_SIZE = 140;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MIN_ZONES_REQUIRED = 3;

Sound.setCategory('Playback');

export default function AlarmTriggerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AlarmTriggerRouteProp>();
  const { alarmId, duration, isTestAlarm } = route.params;
  const { getAlarm } = useAppStore();

  const alarm = alarmId ? getAlarm(alarmId) : null;
  const alarmLabel = alarm?.label || 'Alarm';
  const alarmTime = alarm?.time || '';

  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isDancing, setIsDancing] = useState(false);
  const [activeZoneCount, setActiveZoneCount] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const alarmSoundRef = useRef<Sound | null>(null);
  const danceSoundRef = useRef<Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recorderRef = useRef<MotionDetectorHandle>(null);
  const videoUriRef = useRef<string | null>(null);
  const frameDataRef = useRef<FrameData[]>([]);

  const alarmSoundId = alarm?.alarmSoundId || getDefaultAlarmSoundId();
  const danceSoundId = alarm?.danceSoundId || getDefaultDanceSoundId();
  const customAlarmUri = alarm?.customAlarmSoundUri;
  const customDanceUri = alarm?.customDanceSoundUri;

  useEffect(() => {
    KeepAwake.activate();
    loadSounds();

    return () => {
      KeepAwake.deactivate();
      stopSounds();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isDancing) {
      playDanceSound();
      startTimer();
    } else {
      playAlarmSound();
      pauseTimer();
    }
  }, [isDancing]);

  useEffect(() => {
    if (timeRemaining <= 0) handleComplete();
  }, [timeRemaining]);

  const loadSounds = () => {
    try {
      if (alarmSoundId === CUSTOM_SOUND_ID && customAlarmUri) {
        const alarmSound = new Sound(customAlarmUri, '', (error) => {
          if (error) {
            console.error('Error loading custom alarm sound:', error);
            return;
          }
          alarmSound.setNumberOfLoops(-1);
          alarmSound.setVolume(1.0);
          alarmSound.play();
        });
        alarmSoundRef.current = alarmSound;
      } else {
        const filename = getSoundFilename(alarmSoundId, ALARM_SOUNDS) || 'alarm_clock_1.mp3';
        const alarmSound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error('Error loading alarm sound:', error);
            return;
          }
          alarmSound.setNumberOfLoops(-1);
          alarmSound.setVolume(1.0);
          alarmSound.play();
        });
        alarmSoundRef.current = alarmSound;
      }

      if (danceSoundId === CUSTOM_SOUND_ID && customDanceUri) {
        const danceSound = new Sound(customDanceUri, '', (error) => {
          if (error) {
            console.error('Error loading custom dance sound:', error);
            return;
          }
          danceSound.setNumberOfLoops(-1);
          danceSound.setVolume(0);
        });
        danceSoundRef.current = danceSound;
      } else {
        const filename = getSoundFilename(danceSoundId, DANCE_SOUNDS) || 'dance_song_1.mp3';
        const danceSound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error('Error loading dance sound:', error);
            return;
          }
          danceSound.setNumberOfLoops(-1);
          danceSound.setVolume(0);
        });
        danceSoundRef.current = danceSound;
      }
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  };

  const playAlarmSound = () => {
    try {
      if (danceSoundRef.current) {
        danceSoundRef.current.setVolume(0);
        danceSoundRef.current.pause();
      }
      if (alarmSoundRef.current) {
        alarmSoundRef.current.setVolume(1);
        alarmSoundRef.current.play();
      }
    } catch (error) {}
  };

  const playDanceSound = () => {
    try {
      if (alarmSoundRef.current) {
        alarmSoundRef.current.setVolume(0.2);
      }
      if (danceSoundRef.current) {
        danceSoundRef.current.setVolume(1);
        danceSoundRef.current.play();
      }
    } catch (error) {}
  };

  const stopSounds = () => {
    try {
      if (alarmSoundRef.current) {
        alarmSoundRef.current.stop();
        alarmSoundRef.current.release();
        alarmSoundRef.current = null;
      }
      if (danceSoundRef.current) {
        danceSoundRef.current.stop();
        danceSoundRef.current.release();
        danceSoundRef.current = null;
      }
    } catch (error) {}
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecordingComplete = (videoUri: string | null, frameData: FrameData[]) => {
    videoUriRef.current = videoUri;
    frameDataRef.current = frameData;
  };

  const handleZoneUpdate = (count: number) => {
    setActiveZoneCount(count);
  };

  const handleIntensityUpdate = (val: number) => {
    setIntensity(val);
  };

  const handleComplete = async () => {
    stopSounds();

    let videoUri: string | null = null;
    if (recorderRef.current) {
      videoUri = await recorderRef.current.stopRecording();
    }

    const { score, comment } = calculateScore(frameDataRef.current);

    navigation.replace('Success', {
      duration,
      score,
      comment,
      videoUri: videoUri ?? undefined,
    });
  };

  const handleClose = async () => {
    stopSounds();
    if (recorderRef.current) await recorderRef.current.stopRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    navigation.goBack();
  };

  const progress = (duration - timeRemaining) / duration;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const formatDisplayTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const ringColor = isDancing ? '#00FFFF' : '#FF4444';

  return (
    <View style={styles.container}>
      <MotionDetector
        ref={recorderRef}
        onDancing={setIsDancing}
        isActive={true}
        onRecordingComplete={handleRecordingComplete}
        onZoneUpdate={handleZoneUpdate}
        onIntensityUpdate={handleIntensityUpdate}
        fullScreen
      />

      <View style={styles.overlay} pointerEvents="box-none">
        {isTestAlarm && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            testID="button-close-alarm"
          >
            <X size={28} color="#FFFFFE" />
          </TouchableOpacity>
        )}

        <View style={styles.topSection}>
          {alarmTime ? (
            <Text style={styles.alarmTime}>
              {formatDisplayTime(alarmTime)}
            </Text>
          ) : null}
          <Text style={styles.alarmLabel}>{alarmLabel}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              isDancing ? styles.statusBadgeDancing : styles.statusBadgeAlarm,
            ]}
          >
            <AlertCircle size={14} color={isDancing ? '#22C55E' : '#FF4444'} />
            <Text
              style={[
                styles.statusBadgeText,
                isDancing ? styles.statusTextDancing : styles.statusTextAlarm,
              ]}
            >
              {isDancing ? 'DANCING!' : 'MOVE MORE!'}
            </Text>
          </View>

          <View style={styles.modeBadge}>
            <Music size={14} color="#FFFFFE" />
            <Text style={styles.modeBadgeText}>
              {isDancing ? 'DANCE MODE' : 'ALARM MODE'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.intensitySection}>
            <View style={styles.intensityHeader}>
              <Text style={styles.intensityLabel}>DANCE INTENSITY</Text>
              <Text style={styles.zoneLabel}>
                {activeZoneCount}/{MIN_ZONES_REQUIRED} ZONES (NEED {MIN_ZONES_REQUIRED}+)
              </Text>
            </View>
            <View style={styles.intensityBarBg}>
              <View
                style={[
                  styles.intensityBarFill,
                  {
                    width: `${Math.max(5, intensity * 100)}%`,
                    backgroundColor: intensity > 0.5 ? '#F59E0B' : '#EF4444',
                  },
                ]}
              />
              {intensity > 0.7 && (
                <View
                  style={[
                    styles.intensityBarFill,
                    {
                      width: `${intensity * 100}%`,
                      backgroundColor: '#22C55E',
                      position: 'absolute',
                      right: 0,
                      left: '70%',
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.intensityLabels}>
              <Text style={[styles.intensityLabelText, { color: '#EF4444' }]}>BAD</Text>
              <Text style={[styles.intensityLabelText, { color: '#22C55E' }]}>GOOD</Text>
            </View>
          </View>

          {!isDancing && (
            <Text style={styles.moveMessage}>
              MOVE YOUR WHOLE BODY TO DISMISS!
            </Text>
          )}

          <View style={styles.countdownContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={RING_STROKE}
                fill="rgba(0,0,0,0.4)"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={ringColor}
                strokeWidth={RING_STROKE}
                fill="transparent"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.countdownTextContainer}>
              <Text style={[styles.countdownNumber, { color: ringColor }]}>
                {timeRemaining}s
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  alarmTime: {
    fontSize: 48,
    fontFamily: 'Orbitron',
    color: '#FFFFFE',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  alarmLabel: {
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeAlarm: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusBadgeDancing: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Rajdhani-Bold',
    letterSpacing: 0.5,
  },
  statusTextAlarm: {
    color: '#FF4444',
  },
  statusTextDancing: {
    color: '#22C55E',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeBadgeText: {
    fontSize: 12,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  intensitySection: {
    width: '100%',
    marginBottom: 8,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  intensityLabel: {
    fontSize: 11,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    letterSpacing: 0.5,
  },
  zoneLabel: {
    fontSize: 11,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
    letterSpacing: 0.5,
  },
  intensityBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  intensityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  intensityLabelText: {
    fontSize: 10,
    fontFamily: 'Rajdhani-Bold',
    letterSpacing: 1,
  },
  moveMessage: {
    fontSize: 13,
    fontFamily: 'Rajdhani-Bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  countdownContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 42,
    fontFamily: 'Orbitron',
  },
});
