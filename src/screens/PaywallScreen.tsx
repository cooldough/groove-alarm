import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Crown, Zap } from 'lucide-react-native';

import Button from '../components/Button';
import { useAppStore } from '../lib/store';
import { purchaseLifetime, restorePurchases } from '../lib/purchases';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
type PaywallRouteProp = RouteProp<RootStackParamList, 'Paywall'>;

const FEATURES = [
  { free: '15s dance only', pro: '15s - 3 min dance' },
  { free: '1 alarm', pro: 'Unlimited alarms' },
  { free: 'One-time alarms', pro: 'Repeat scheduling' },
  { free: 'Basic sounds', pro: 'All premium sounds' },
];

export default function PaywallScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaywallRouteProp>();
  const { setPremium } = useAppStore();
  const [loading, setLoading] = useState(false);

  const fromOnboarding = route.params?.fromOnboarding;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const success = await purchaseLifetime();
      if (success) {
        setPremium(true);
        navigation.replace('Dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        setPremium(true);
        navigation.replace('Dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (fromOnboarding) {
      navigation.replace('Dashboard');
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        testID="button-close-paywall"
      >
        <X size={24} color="#A0A0B0" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Crown size={48} color="#FF00FF" />
          <Text style={styles.title}>UNLOCK PRO</Text>
          <Text style={styles.subtitle}>Get the full Groove Alarm experience</Text>
        </View>

        <View style={styles.comparison}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>FREE</Text>
            <Text style={[styles.comparisonTitle, styles.proTitle]}>PRO</Text>
          </View>

          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Check size={16} color="#A0A0B0" />
                <Text style={styles.featureText}>{feature.free}</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#00FFFF" />
                <Text style={[styles.featureText, styles.proFeatureText]}>
                  {feature.pro}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <Zap size={20} color="#FF00FF" />
            <Text style={styles.priceLabel}>LIFETIME ACCESS</Text>
          </View>
          <Text style={styles.priceValue}>$2.99</Text>
          <Text style={styles.priceSubtext}>One-time purchase. No subscription.</Text>
        </View>

        <Button
          title="Unlock Pro - $2.99"
          onPress={handlePurchase}
          loading={loading}
          style={styles.purchaseButton}
          testID="button-purchase"
        />

        <TouchableOpacity onPress={handleRestore} testID="button-restore">
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <View style={styles.legal}>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.legalLink}>Privacy</Text>
          </TouchableOpacity>
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
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    marginTop: 16,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 8,
  },
  comparison: {
    width: '100%',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A50',
  },
  comparisonTitle: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#A0A0B0',
    flex: 1,
    textAlign: 'center',
  },
  proTitle: {
    color: '#00FFFF',
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    flex: 1,
  },
  proFeatureText: {
    color: '#FFFFFE',
  },
  priceCard: {
    width: '100%',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF00FF',
    marginBottom: 24,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Rajdhani-Bold',
    color: '#FF00FF',
    letterSpacing: 2,
  },
  priceValue: {
    fontSize: 48,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  priceSubtext: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    marginTop: 4,
  },
  purchaseButton: {
    width: '100%',
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textDecorationLine: 'underline',
  },
  legal: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  legalLink: {
    fontSize: 12,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
  },
  legalDivider: {
    fontSize: 12,
    color: '#3A3A50',
  },
});
