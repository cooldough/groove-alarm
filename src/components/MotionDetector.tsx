import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
  VideoFile,
} from 'react-native-vision-camera';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import RNFS from 'react-native-fs';

interface MotionScore {
  totalIntensity: number;
  frameCount: number;
  dancingFrames: number;
  peakIntensity: number;
  zoneActivations: number[];
}

interface MotionDetectorProps {
  onDancing: (isDancing: boolean) => void;
  onScoreUpdate?: (score: number) => void;
  onSessionComplete?: (finalScore: number, comment: string) => void;
  onVideoRecorded?: (videoUri: string) => void;
  isActive: boolean;
  shouldRecord?: boolean;
}

const GRID_SIZE = 3;
const MOTION_THRESHOLD = 30;
const MIN_ACTIVE_ZONES = 3;
const CAPTURE_INTERVAL = 100;

const SCORE_COMMENTS: { min: number; max: number; comment: string }[] = [
  { min: 95, max: 100, comment: "Beyonc\u00e9 called, she's worried" },
  { min: 80, max: 94, comment: 'Not bad for someone half asleep' },
  { min: 60, max: 79, comment: 'The vibes were there... barely' },
  { min: 40, max: 59, comment: 'Your bed is judging you right now' },
  { min: 20, max: 39, comment: 'Was that dancing or a cry for help?' },
  { min: 0, max: 19, comment: "We've seen better movement from a statue" },
];

export function getScoreComment(score: number): string {
  const entry = SCORE_COMMENTS.find((s) => score >= s.min && score <= s.max);
  return entry?.comment || "We've seen better movement from a statue";
}

export function calculateFinalScore(scoreData: MotionScore): number {
  if (scoreData.frameCount === 0) return 0;

  const avgIntensity = scoreData.totalIntensity / scoreData.frameCount;
  const intensityScore = Math.min(avgIntensity / 80, 1) * 40;

  const consistency = scoreData.dancingFrames / scoreData.frameCount;
  const consistencyScore = consistency * 35;

  const totalZoneActivations = scoreData.zoneActivations.reduce(
    (a, b) => a + b,
    0,
  );
  const avgZonesPerFrame =
    totalZoneActivations / Math.max(scoreData.frameCount, 1);
  const varietyScore = Math.min(avgZonesPerFrame / 6, 1) * 15;

  const peakBonus = Math.min(scoreData.peakIntensity / 120, 1) * 10;

  const rawScore = intensityScore + consistencyScore + varietyScore + peakBonus;
  return Math.round(Math.min(Math.max(rawScore, 0), 100));
}

export default function MotionDetector({
  onDancing,
  onScoreUpdate,
  onSessionComplete,
  onVideoRecorded,
  isActive,
  shouldRecord = false,
}: MotionDetectorProps) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [activeZones, setActiveZones] = useState<boolean[]>(
    Array(9).fill(false),
  );
  const previousFrameRef = useRef<number[][]>([]);
  const isRecordingRef = useRef(false);
  const scoreRef = useRef<MotionScore>({
    totalIntensity: 0,
    frameCount: 0,
    dancingFrames: 0,
    peakIntensity: 0,
    zoneActivations: Array(9).fill(0),
  });

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  useEffect(() => {
    if (isActive && shouldRecord && hasPermission && device && !isRecordingRef.current) {
      startVideoRecording();
    }
  }, [isActive, shouldRecord, hasPermission, device]);

  useEffect(() => {
    if (!isActive && isRecordingRef.current) {
      stopVideoRecording();
    }
  }, [isActive]);

  const startVideoRecording = async () => {
    if (!cameraRef.current || isRecordingRef.current) return;

    try {
      isRecordingRef.current = true;
      cameraRef.current.startRecording({
        onRecordingFinished: (video: VideoFile) => {
          isRecordingRef.current = false;
          const videoPath = Platform.OS === 'android'
            ? `file://${video.path}`
            : video.path;
          onVideoRecorded?.(videoPath);
        },
        onRecordingError: (error) => {
          isRecordingRef.current = false;
          console.error('Recording error:', error);
        },
      });
    } catch (error) {
      isRecordingRef.current = false;
      console.error('Failed to start recording:', error);
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current || !isRecordingRef.current) return;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      isRecordingRef.current = false;
    }
  };

  const analyzeFrame = useCallback(async () => {
    if (!cameraRef.current || !isActive) return;

    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
      });

      const base64 = await RNFS.readFile(
        photo.path,
        'base64',
      );

      RNFS.unlink(photo.path).catch(() => {});

      const currentFrame = processFrame(base64);

      if (previousFrameRef.current.length > 0) {
        const { zones, intensities } = detectMotionInZonesWithIntensity(
          previousFrameRef.current,
          currentFrame,
        );
        setActiveZones(zones);

        const activeCount = zones.filter(Boolean).length;
        const isDancing = activeCount >= MIN_ACTIVE_ZONES;

        const frameIntensity =
          intensities.reduce((a, b) => a + b, 0) / intensities.length;
        const score = scoreRef.current;
        score.frameCount++;
        score.totalIntensity += frameIntensity;
        if (isDancing) score.dancingFrames++;
        if (frameIntensity > score.peakIntensity)
          score.peakIntensity = frameIntensity;
        zones.forEach((active, i) => {
          if (active) score.zoneActivations[i]++;
        });

        const currentScore = calculateFinalScore(score);
        onScoreUpdate?.(currentScore);

        if (isDancing) {
          ReactNativeHapticFeedback.trigger('impactLight');
        }

        onDancing(isDancing);
      }

      previousFrameRef.current = currentFrame;
    } catch (error) {
      console.log('Frame capture error:', error);
    }
  }, [isActive, onDancing, onScoreUpdate]);

  useEffect(() => {
    if (!isActive || !hasPermission || !device) return;

    const interval = setInterval(analyzeFrame, CAPTURE_INTERVAL);
    return () => clearInterval(interval);
  }, [isActive, hasPermission, device, analyzeFrame]);

  const processFrame = (base64: string): number[][] => {
    const data = atob(base64);
    const zones: number[][] = [];
    const zoneSize = Math.floor(data.length / 9);

    for (let i = 0; i < 9; i++) {
      const start = i * zoneSize;
      const end = start + zoneSize;
      const zoneData: number[] = [];

      for (let j = start; j < end; j += 100) {
        zoneData.push(data.charCodeAt(j));
      }
      zones.push(zoneData);
    }

    return zones;
  };

  const detectMotionInZonesWithIntensity = (
    prev: number[][],
    current: number[][],
  ): { zones: boolean[]; intensities: number[] } => {
    const zones: boolean[] = [];
    const intensities: number[] = [];

    current.forEach((zone, i) => {
      if (!prev[i]) {
        zones.push(false);
        intensities.push(0);
        return;
      }

      let totalDiff = 0;
      const sampleSize = Math.min(zone.length, prev[i].length);

      for (let j = 0; j < sampleSize; j++) {
        totalDiff += Math.abs(zone[j] - prev[i][j]);
      }

      const avgDiff = totalDiff / sampleSize;
      zones.push(avgDiff > MOTION_THRESHOLD);
      intensities.push(avgDiff);
    });

    return { zones, intensities };
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera device available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={isActive}
        photo={true}
        video={true}
        audio={false}
      />

      <View style={styles.gridOverlay}>
        {activeZones.map((active, index) => (
          <View
            key={index}
            style={[styles.gridCell, active && styles.gridCellActive]}
          />
        ))}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const cameraSize = width * 0.8;

const styles = StyleSheet.create({
  container: {
    width: cameraSize,
    height: cameraSize,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 255, 0.3)',
  },
  gridCellActive: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    borderColor: '#00FFFF',
  },
  text: {
    color: '#FFFFFE',
    fontFamily: 'Rajdhani',
    fontSize: 16,
    textAlign: 'center',
  },
  subtext: {
    color: '#A0A0B0',
    fontFamily: 'Rajdhani',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
