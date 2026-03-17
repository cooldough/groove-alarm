import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { useAppStore } from '../lib/store';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'STOP SNOOZING,',
    subtitle: 'START GROOVING',
    description:
      "The only alarm that won't stop until you bust a move. 15 seconds of dance is all it takes to start your day right.",
    showCamera: false,
  },
  {
    id: '2',
    title: 'MOTION',
    subtitle: 'DETECTION',
    description:
      'We use your camera to detect movement. Dance, jump, or shake - just keep moving to dismiss your alarm!',
    showCamera: true,
  },
  {
    id: '3',
    title: 'READY TO',
    subtitle: 'WAKE UP?',
    description:
      'Set your first alarm and never oversleep again. Your body will thank you!',
    showCamera: false,
  },
];

function CameraPreview() {
  const device = useCameraDevice('front');
  const { hasPermission } = useCameraPermission();

  if (!hasPermission || !device) return null;

  return <Camera style={styles.camera} device={device} isActive={true} />;
}

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cameraGranted, setCameraGranted] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const { setFirstTimeUser } = useAppStore();

  useEffect(() => {
    if (hasPermission) {
      setCameraGranted(true);
    }
  }, [hasPermission]);

  const requestCameraPermission = async () => {
    const granted = await requestPermission();
    setCameraGranted(granted);
  };

  const handleNext = () => {
    if (currentIndex === 1 && !cameraGranted) {
      requestCameraPermission();
    }

    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setFirstTimeUser(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const renderSlide = ({
    item,
  }: {
    item: (typeof SLIDES)[0];
  }) => (
    <View style={styles.slide}>
      {item.showCamera && cameraGranted ? (
        <View style={styles.cameraPreview}>
          <CameraPreview />
        </View>
      ) : (
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/images/adaptive-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      )}

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        testID="button-skip"
      >
        <Text style={styles.skipText}>SKIP</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          testID="button-next"
        >
          <ChevronRight size={32} color="#0F0E17" />
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
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#A0A0B0',
    fontFamily: 'Rajdhani-Bold',
    fontSize: 14,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#FF00FF',
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#00FFFF',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Orbitron',
    color: '#FFFFFE',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 32,
    fontFamily: 'Orbitron',
    color: '#FF00FF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Rajdhani',
    color: '#A0A0B0',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A3A50',
  },
  paginationDotActive: {
    backgroundColor: '#FF00FF',
    width: 32,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF00FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
