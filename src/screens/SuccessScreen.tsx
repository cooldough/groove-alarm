import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Download, Share2, SkipForward, Trophy } from 'lucide-react-native';

import ShareCard, { ShareCardHandle } from '../components/ShareCard';
import { saveVideoToCameraRoll, shareVideoWithBranding, shareContent } from '../lib/sharing';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Success'>;
type SuccessRouteProp = RouteProp<RootStackParamList, 'Success'>;

export default function SuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SuccessRouteProp>();
  const { duration, score = 0, comment = '', videoUri } = route.params;
  const confettiRef = useRef<any>(null);
  const shareCardRef = useRef<ShareCardHandle>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [videoSaved, setVideoSaved] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);

    if (score > 0) {
      const step = Math.max(1, Math.ceil(score / 30));
      let current = 0;
      const interval = setInterval(() => {
        current += step;
        if (current >= score) {
          current = score;
          clearInterval(interval);
        }
        setDisplayScore(current);
      }, 40);
      return () => clearInterval(interval);
    }
  }, [score]);

  const handleDone = () => {
    navigation.replace('Dashboard');
  };

  const handleSaveVideo = async () => {
    if (!videoUri) return;
    setSaving(true);
    try {
      const saved = await saveVideoToCameraRoll(videoUri);
      if (saved) {
        setVideoSaved(true);
        Alert.alert('Saved!', 'Your dance video has been saved to your camera roll.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (videoUri) {
        // Share the recorded video clip with branding
        await shareVideoWithBranding(videoUri, score);
      } else if (shareCardRef.current) {
        // Fallback: share the score card image
        const uri = await shareCardRef.current.capture();
        await shareContent(uri);
      } else {
        Alert.alert('Unable to share', 'No content available to share.');
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  const hasVideo = !!videoUri;
  const hasScore = score > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: 0, y: 0 }}
        autoStart={false}
        fadeOut
        colors={['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#8000FF']}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Trophy size={50} color="#FF00FF" />
        </View>

        <Text style={styles.title}>YOU DID IT!</Text>
        <Text style={styles.subtitle}>Alarm dismissed</Text>

        {hasScore ? (
          <View style={styles.scoreSection}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{displayScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.comment}>{comment}</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>seconds danced</Text>
            </View>
          </View>
        )}

        {hasScore && (
          <View style={styles.shareCardWrapper}>
            <ShareCard
              ref={shareCardRef}
              score={score}
              comment={comment}
              duration={duration}
            />
          </View>
        )}

        <View style={styles.actions}>
          {hasVideo && (
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveVideo}
              disabled={saving || videoSaved}
              testID="button-save-video"
            >
              <Download size={20} color={videoSaved ? '#A0A0B0' : '#00FFFF'} />
              <Text
                style={[
                  styles.actionText,
                  styles.saveText,
                  videoSaved && styles.disabledText,
                ]}
              >
                {videoSaved ? 'Saved' : saving ? 'Saving...' : 'Save Video'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
            disabled={sharing}
            testID="button-share"
          >
            <Share2 size={20} color="#0F0E17" />
            <Text style={[styles.actionText, styles.shareText]}>
              {sharing ? 'Sharing...' : 'Share Clip'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleDone}
          testID="button-done"
        >
          <SkipForward size={16} color="#A0A0B0" />
          <Text style={styles.skipText}>Done</Text>
        </TouchableOpacity>
      </View>
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
    padding: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF00FF',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginBottom: 32,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  scoreMax: {
    fontSize: 24,
    fontFamily: 'Orbitron',
    color: '#A0A0B0',
    marginLeft: 4,
  },
  comment: {
    fontSize: 18,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 48,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 4,
  },
  shareCardWrapper: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00FFFF',
  },
  shareButton: {
    backgroundColor: '#FF00FF',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
  },
  saveText: {
    color: '#00FFFF',
  },
  shareText: {
    color: '#0F0E17',
  },
  disabledText: {
    color: '#A0A0B0',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
  },
});
