import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsScreen() {
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
        <Text style={styles.title}>TERMS AND CONDITIONS</Text>
        <Text style={styles.date}>Last Updated: February 5, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Use of Service</Text>
          <Text style={styles.sectionText}>
            By using Groove Alarm, you agree that Kalopsia Labs is providing
            a tool for personal use "as is."
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Physical Safety Disclaimer</Text>
          <Text style={styles.sectionText}>
            You acknowledge that using a "dance-based" alarm requires movement
            upon waking. Kalopsia Labs is not responsible for any injuries,
            trips, or falls that occur while you are interacting with the app.
            Please ensure your floor is clear of obstacles before setting your
            alarm.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. No Guarantee of Waking</Text>
          <Text style={styles.sectionText}>
            While Groove Alarm is designed to be persistent, we cannot
            guarantee it will wake you up in 100% of scenarios (e.g., hardware
            failure, dead battery). Kalopsia Labs is not liable for any losses
            (missed work, flights, or appointments) resulting from a failure to
            wake up.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            The UI, design, and "Dance to Dismiss" logic are the property of
            Kalopsia Labs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Support</Text>
          <Text style={styles.sectionText}>
            For help or feedback, contact{' '}
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
  link: {
    color: '#FF00FF',
    textDecorationLine: 'underline',
  },
});
