import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        testID="button-back"
      >
        <ArrowLeft size={24} color="#FFFFFE" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>PRIVACY POLICY</Text>
        <Text style={styles.date}>Effective Date: February 5, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. No Data Collection</Text>
          <Text style={styles.sectionText}>
            Groove Alarm does not collect, store, or transmit any personal
            information, usage data, or telemetry. We believe that what you do in
            your bedroom to wake up is your business.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Camera and Sensor Privacy</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Motion Detection:</Text> The app uses your
            device's front camera to detect movement and dismiss your alarm. Motion
            analysis is performed locally in volatile memory and is not stored.
          </Text>
          <Text style={[styles.sectionText, { marginTop: 12 }]}>
            <Text style={styles.bold}>Video Recording:</Text> During each alarm
            dismissal, the app records a short video of your dance. This video is
            stored locally on your device only. It is never uploaded or sent to any
            server. You choose whether to save it to your camera roll or share it
            — sharing only happens when you explicitly tap "Share Now".
          </Text>
          <Text style={[styles.sectionText, { marginTop: 12 }]}>
            <Text style={styles.bold}>Scoring Data:</Text> Movement data from the
            camera is used to calculate your dance score. This data is processed
            locally and discarded after the score is calculated.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Third-Party Access</Text>
          <Text style={styles.sectionText}>
            Since we do not collect any data, there is no data to sell, rent, or
            share with third parties. We do not use any third-party tracking or
            advertising SDKs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Permissions</Text>
          <Text style={styles.sectionText}>
            The app will request Camera and Media Library permissions.
            Camera is used for the "Dance to Dismiss" feature and
            motion detection. Media Library access is used to save dance videos to
            your camera roll when you choose to do so. If Camera permission is
            denied, the movement-based alarm features will not function.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions, feel free to reach out at{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('mailto:support@kalopsialabs.com')}
            >
              support@kalopsialabs.com
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backText: {
    color: '#FFFFFE',
    fontFamily: 'Rajdhani',
    fontSize: 16,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    marginBottom: 8,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    lineHeight: 22,
  },
  bold: {
    fontFamily: 'Rajdhani-Bold',
    color: '#FFFFFE',
  },
  link: {
    color: '#FF00FF',
    textDecorationLine: 'underline',
  },
});
