import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import Button from '../components/Button';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Success'>;
type SuccessRouteProp = RouteProp<RootStackParamList, 'Success'>;

export default function SuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SuccessRouteProp>();
  const { duration, score, comment } = route.params;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    ReactNativeHapticFeedback.trigger('notificationSuccess');

    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);
  }, []);

  const handleDone = () => {
    navigation.replace('Dashboard');
  };

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
          <Text style={styles.icon}>
            {score >= 80 ? '🔥' : score >= 60 ? '💃' : score >= 40 ? '🕺' : '😅'}
          </Text>
        </View>

        <Text style={styles.title}>YOU DID IT!</Text>
        <Text style={styles.subtitle}>Alarm dismissed</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>seconds</Text>
            </View>
          </View>
        </View>

        <Text style={styles.comment}>"{comment}"</Text>

        <Button
          title="Done"
          onPress={handleDone}
          style={styles.button}
          testID="button-done"
        />
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#FF00FF',
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Orbitron',
    color: '#00FFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginBottom: 32,
  },
  statsContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3A3A50',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 40,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3A3A50',
  },
  comment: {
    fontSize: 18,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
  },
});
