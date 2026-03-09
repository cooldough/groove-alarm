import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Vibration } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import KeepAwake from 'react-native-keep-awake';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import MotionDetector, { getScoreComment } from '../components/MotionDetector';
import PostAlarmModal from '../components/PostAlarmModal';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlarmTrigger'>;
type AlarmTriggerRouteProp = RouteProp<RootStackParamList, 'AlarmTrigger'>;

Sound.setCategory('Playback');

const { width } = Dimensions.get('window');

export default function AlarmTriggerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AlarmTriggerRouteProp>();
  const { duration } = route.params;

  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isDancing, setIsDancing] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalComment, setFinalComment] = useState('');
  const [showPostAlarmModal, setShowPostAlarmModal] = useState(false);
  const alarmSoundRef = useRef<Sound | null>(null);
  const danceSoundRef = useRef<Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    KeepAwake.activate();
    loadSounds();
    startVibration();

    return () => {
      KeepAwake.deactivate();
      stopSounds();
      Vibration.cancel();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isComplete) return;
    if (isDancing) {
      playDanceSound();
      startTimer();
    } else {
      playAlarmSound();
      pauseTimer();
    }
  }, [isDancing, isComplete]);

  useEffect(() => {
    if (timeRemaining <= 0 && !isComplete) {
      handleComplete();
    }
  }, [timeRemaining, isComplete]);

  const loadSounds = () => {
    try {
      const alarmSound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Error loading alarm sound:', error);
          return;
        }
        alarmSound.setNumberOfLoops(-1);
        alarmSound.setVolume(1.0);
        alarmSound.play();
      });
      alarmSoundRef.current = alarmSound;

      const danceSound = new Sound('dance.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Error loading dance sound:', error);
          return;
        }
        danceSound.setNumberOfLoops(-1);
        danceSound.setVolume(0);
      });
      danceSoundRef.current = danceSound;
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
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
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
    } catch (error) {
      console.error('Error playing dance sound:', error);
    }
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
    } catch (error) {
      console.error('Error stopping sounds:', error);
    }
  };

  const startVibration = () => {
    Vibration.vibrate([500, 500], true);
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

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  const handleComplete = () => {
    setIsComplete(true);
    ReactNativeHapticFeedback.trigger('notificationSuccess');
    Vibration.cancel();
    stopSounds();

    const score = currentScore;
    const comment = getScoreComment(score);
    setFinalScore(score);
    setFinalComment(comment);
    setShowPostAlarmModal(true);
  };

  const handlePostAlarmClose = () => {
    setShowPostAlarmModal(false);
    navigation.replace('Success', {
      duration,
      score: finalScore,
      comment: finalComment,
    });
  };

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isDancing ? 'KEEP DANCING!' : 'WAKE UP!'}
        </Text>
        <Text style={styles.subtitle}>
          {isDancing
            ? 'Great moves! Keep it going!'
            : 'Start moving to dismiss the alarm'}
        </Text>

        <View style={styles.cameraContainer}>
          <MotionDetector
            onDancing={setIsDancing}
            onScoreUpdate={handleScoreUpdate}
            isActive={!isComplete}
          />
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{currentScore}</Text>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.progressRing}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: isDancing ? '#00FFFF' : '#FF00FF',
                  transform: [{ rotate: `${(progress / 100) * 360}deg` }],
                },
              ]}
            />
            <View style={styles.progressInner}>
              <Text style={styles.timerText}>{timeRemaining}</Text>
              <Text style={styles.timerLabel}>seconds</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.status, isDancing && styles.statusActive]}>
          {isDancing ? '● MOTION DETECTED' : '○ WAITING FOR MOTION'}
        </Text>
      </View>

      <PostAlarmModal
        visible={showPostAlarmModal}
        score={finalScore}
        comment={finalComment}
        duration={duration}
        videoUri={null}
        onClose={handlePostAlarmClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textAlign: 'center',
    marginBottom: 24,
  },
  cameraContainer: {
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
    letterSpacing: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
  },
  timerContainer: {
    marginBottom: 16,
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3A3A50',
  },
  progressFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    opacity: 0.3,
  },
  progressInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 36,
    fontFamily: 'Orbitron',
    color: '#FFFFFE',
  },
  timerLabel: {
    fontSize: 10,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: -4,
  },
  status: {
    fontSize: 14,
    fontFamily: 'ShareTechMono',
    color: '#A0A0B0',
  },
  statusActive: {
    color: '#00FFFF',
  },
});
