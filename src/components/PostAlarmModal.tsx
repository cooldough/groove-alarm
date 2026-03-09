import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Share from 'react-native-share';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Share2, X } from 'lucide-react-native';

import ShareCard, { ShareCardHandle } from './ShareCard';
import Button from './Button';

interface PostAlarmModalProps {
  visible: boolean;
  score: number;
  comment: string;
  duration: number;
  videoUri: string | null;
  onClose: () => void;
}

export default function PostAlarmModal({
  visible,
  score,
  comment,
  duration,
  videoUri,
  onClose,
}: PostAlarmModalProps) {
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saved, setSaved] = useState(false);
  const shareCardRef = useRef<ShareCardHandle>(null);

  const handleSaveVideo = async () => {
    if (!videoUri) {
      Alert.alert('No Video', 'No dance video was recorded for this session.');
      return;
    }

    setSaving(true);
    try {
      await CameraRoll.saveAsset(videoUri, { type: 'video' });
      setSaved(true);
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      Alert.alert(
        'Saved!',
        'Your dance video has been saved to your camera roll.',
      );
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      let fileToShare = videoUri;

      if (!fileToShare && shareCardRef.current) {
        fileToShare = await shareCardRef.current.capture();
      }

      if (!fileToShare) {
        Alert.alert('Error', 'Nothing to share. Please try again.');
        return;
      }

      const isVideo = !!videoUri;
      const shareOptions = {
        title: `I scored ${score}/100 on Groove Alarm!`,
        message: `I scored ${score}/100 on Groove Alarm! "${comment}"`,
        url: Platform.OS === 'android' ? `file://${fileToShare}` : fileToShare,
        type: isVideo ? 'video/mp4' : 'image/png',
      };

      await Share.open(shareOptions);
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    } catch (error: any) {
      if (error.message?.includes('dismissed') || error.message?.includes('cancel')) return;
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const getScoreEmoji = () => {
    if (score >= 95) return '🔥';
    if (score >= 80) return '💃';
    if (score >= 60) return '🕺';
    if (score >= 40) return '😅';
    if (score >= 20) return '😬';
    return '🗿';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="button-skip-share"
          >
            <X size={24} color="#A0A0B0" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.emoji}>{getScoreEmoji()}</Text>
            <Text style={styles.title}>YOUR SCORE</Text>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>

            <Text style={styles.comment}>"{comment}"</Text>

            <View style={styles.shareCardWrapper}>
              <ShareCard
                ref={shareCardRef}
                score={score}
                comment={comment}
                duration={duration}
              />
            </View>

            <View style={styles.actions}>
              {videoUri && (
                <Button
                  title={saved ? 'Saved!' : 'Save Video'}
                  onPress={handleSaveVideo}
                  loading={saving}
                  variant={saved ? 'ghost' : 'primary'}
                  style={styles.actionButton}
                  testID="button-save-video"
                />
              )}

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                disabled={sharing}
                testID="button-share-now"
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#0F0E17" />
                ) : (
                  <>
                    <Share2 size={20} color="#0F0E17" />
                    <Text style={styles.shareButtonText}>Share Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onClose}
                testID="button-skip"
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#0F0E17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '60%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    padding: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
    letterSpacing: 4,
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scoreMax: {
    fontSize: 24,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginLeft: 4,
  },
  comment: {
    fontSize: 18,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  shareCardWrapper: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: 'Rajdhani-Bold',
    color: '#0F0E17',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textDecorationLine: 'underline',
  },
});
