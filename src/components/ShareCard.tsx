import { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';

interface ShareCardProps {
  score: number;
  comment: string;
  duration: number;
}

export interface ShareCardHandle {
  capture: () => Promise<string>;
}

const ShareCard = forwardRef<ShareCardHandle, ShareCardProps>(
  ({ score, comment, duration }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!viewShotRef.current?.capture) {
          throw new Error('ViewShot not ready');
        }
        return await viewShotRef.current.capture();
      },
    }));

    const getScoreColor = () => {
      if (score >= 80) return '#00FFFF';
      if (score >= 60) return '#00FF80';
      if (score >= 40) return '#FFD700';
      if (score >= 20) return '#FF8000';
      return '#FF0040';
    };

    return (
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1 }}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.topSection}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>[LOGO]</Text>
            </View>
            <Text style={styles.appName}>GROOVE ALARM</Text>
          </View>

          <View style={styles.scoreSection}>
            <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
              {score}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>

          <Text style={styles.comment}>"{comment}"</Text>

          <View style={styles.divider} />

          <Text style={styles.shareText}>Share your dance today</Text>

          <View style={styles.bottomSection}>
            <Text style={styles.storeText}>
              Search Groove Alarm on the App Store & Google Play
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duration}s</Text>
              <Text style={styles.statLabel}>danced</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor() }]}>
                {score >= 80 ? 'A+' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'}
              </Text>
              <Text style={styles.statLabel}>grade</Text>
            </View>
          </View>
        </View>
      </ViewShot>
    );
  }
);

ShareCard.displayName = 'ShareCard';
export default ShareCard;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: width - 48,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#0F0E17',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF00FF',
    overflow: 'hidden',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF00FF',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 10,
    fontFamily: 'ShareTechMono',
    color: '#FF00FF',
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    letterSpacing: 3,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 72,
    fontFamily: 'Orbitron',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  scoreMax: {
    fontSize: 28,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginLeft: 4,
  },
  comment: {
    fontSize: 18,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#3A3A50',
    marginBottom: 16,
  },
  shareText: {
    fontSize: 16,
    fontFamily: 'Rajdhani-Bold',
    color: '#00FFFF',
    marginBottom: 8,
  },
  bottomSection: {
    marginBottom: 16,
  },
  storeText: {
    fontSize: 12,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Orbitron',
    color: '#FFFFFE',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#3A3A50',
  },
});
