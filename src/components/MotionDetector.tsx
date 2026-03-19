import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { FrameData } from '../lib/motionScorer';

export interface MotionDetectorHandle {
  stopRecording: () => Promise<string | null>;
}

interface MotionDetectorProps {
  onDancing: (isDancing: boolean) => void;
  isActive: boolean;
  onRecordingComplete?: (
    videoUri: string | null,
    frameData: FrameData[],
  ) => void;
  onZoneUpdate?: (activeCount: number, zones: boolean[]) => void;
  onIntensityUpdate?: (intensity: number) => void;
  fullScreen?: boolean;
}

const MOTION_THRESHOLD = 18;
const MIN_ACTIVE_ZONES = 3;
const CAPTURE_INTERVAL = 700;
const MAX_FAILURES = 5;
const SAMPLE_COUNT = 80;
const SKIP_FRAMES = 2;

const B64_LOOKUP: Record<string, number> = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  .split('')
  .forEach((c, i) => {
    B64_LOOKUP[c] = i;
  });

function decodeBase64Triplet(
  b64: string,
  offset: number,
): [number, number, number] {
  const c0 = B64_LOOKUP[b64[offset]] || 0;
  const c1 = B64_LOOKUP[b64[offset + 1]] || 0;
  const c2 = B64_LOOKUP[b64[offset + 2]] || 0;
  const c3 = B64_LOOKUP[b64[offset + 3]] || 0;
  const b0 = (c0 << 2) | (c1 >> 4);
  const b1 = ((c1 & 0x0f) << 4) | (c2 >> 2);
  const b2 = ((c2 & 0x03) << 6) | c3;
  return [b0 & 0xff, b1 & 0xff, b2 & 0xff];
}

const MotionDetector = forwardRef<MotionDetectorHandle, MotionDetectorProps>(
  (
    {
      onDancing,
      isActive,
      onRecordingComplete,
      onZoneUpdate,
      onIntensityUpdate,
      fullScreen,
    },
    ref,
  ) => {
    const cameraRef = useRef<Camera>(null);
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('front');

    const [activeZones, setActiveZones] = useState<boolean[]>(
      Array(9).fill(false),
    );
    const [useSimulation, setUseSimulation] = useState(false);
    const [permissionRequested, setPermissionRequested] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    const previousAvgsRef = useRef<number[]>([]);
    const capturingRef = useRef(false);
    const frameDataRef = useRef<FrameData[]>([]);
    const failureCountRef = useRef(0);
    const frameCountRef = useRef(0);
    const isRecordingRef = useRef(false);
    const videoUriRef = useRef<string | null>(null);
    const recordingStartedRef = useRef(false);

    useEffect(() => {
      if (!hasPermission && !permissionRequested) {
        setPermissionRequested(true);
        requestPermission();
      }
    }, [hasPermission, permissionRequested]);

    // Start video recording after camera is ready and motion analysis has started
    useEffect(() => {
      if (!hasPermission || !device || !isActive || !cameraReady) return;

      // Delay recording start to let photo-based analysis begin first
      const timer = setTimeout(() => {
        if (cameraRef.current && !isRecordingRef.current) {
          try {
            isRecordingRef.current = true;
            recordingStartedRef.current = true;
            cameraRef.current.startRecording({
              onRecordingFinished: (video) => {
                videoUriRef.current = video.path;
                isRecordingRef.current = false;
              },
              onRecordingError: (error) => {
                console.warn('Recording error (non-fatal):', error);
                isRecordingRef.current = false;
                recordingStartedRef.current = false;
              },
            });
          } catch (err) {
            console.warn('Failed to start recording (non-fatal):', err);
            isRecordingRef.current = false;
            recordingStartedRef.current = false;
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    }, [hasPermission, device, isActive, cameraReady]);

    useImperativeHandle(ref, () => ({
      stopRecording: async () => {
        try {
          if (cameraRef.current && isRecordingRef.current) {
            await cameraRef.current.stopRecording();
            // Wait for the onRecordingFinished callback
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (err) {
          console.warn('Error stopping recording:', err);
        }
        onRecordingComplete?.(videoUriRef.current, frameDataRef.current);
        return videoUriRef.current;
      },
    }));

    const computeZoneAverages = useCallback(
      (base64: string): number[] => {
        const len = base64.length;
        const zoneSize = Math.floor(len / 9);
        const averages: number[] = [];

        for (let i = 0; i < 9; i++) {
          const zoneStart = i * zoneSize;
          const step = Math.max(4, Math.floor(zoneSize / SAMPLE_COUNT));
          let sum = 0;
          let count = 0;

          for (let j = 0; j < SAMPLE_COUNT; j++) {
            const offset = zoneStart + j * step;
            const aligned = offset - (offset % 4);
            if (aligned + 4 <= len) {
              const [b0, b1, b2] = decodeBase64Triplet(base64, aligned);
              sum += (b0 + b1 + b2) / 3;
              count++;
            }
          }

          averages.push(count > 0 ? sum / count : 0);
        }

        return averages;
      },
      [],
    );

    const simulateMotion = useCallback(() => {
      const zones = Array(9)
        .fill(false)
        .map(() => Math.random() > 0.4);
      setActiveZones(zones);

      const activeCount = zones.filter(Boolean).length;
      const dancing = activeCount >= MIN_ACTIVE_ZONES;
      const intensity = Math.min(1, activeCount / 9);

      frameDataRef.current.push({
        timestamp: Date.now(),
        activeZones: [...zones],
        activeCount,
      });

      onZoneUpdate?.(activeCount, zones);
      onIntensityUpdate?.(intensity);
      onDancing(dancing);
    }, [onDancing, onZoneUpdate, onIntensityUpdate]);

    const analyzeFrame = useCallback(async () => {
      if (useSimulation) {
        simulateMotion();
        return;
      }

      if (!cameraRef.current || !isActive || capturingRef.current) return;

      capturingRef.current = true;
      try {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'speed',
        });

        const base64 = await RNFS.readFile(photo.path, 'base64');

        if (!base64 || base64.length < 100) {
          failureCountRef.current++;
          if (failureCountRef.current >= MAX_FAILURES) {
            console.warn('Too many photo failures, switching to simulation');
            setUseSimulation(true);
          }
          return;
        }

        failureCountRef.current = 0;
        frameCountRef.current++;

        if (frameCountRef.current <= SKIP_FRAMES) {
          previousAvgsRef.current = computeZoneAverages(base64);
          // Clean up temp file
          try { await RNFS.unlink(photo.path); } catch (_) {}
          return;
        }

        const currentAvgs = computeZoneAverages(base64);

        if (previousAvgsRef.current.length > 0) {
          const zones = currentAvgs.map((avg, i) => {
            const diff = Math.abs(avg - previousAvgsRef.current[i]);
            return diff > MOTION_THRESHOLD;
          });

          setActiveZones(zones);

          const activeCount = zones.filter(Boolean).length;
          const dancing = activeCount >= MIN_ACTIVE_ZONES;
          const intensity = Math.min(1, activeCount / 9);

          frameDataRef.current.push({
            timestamp: Date.now(),
            activeZones: [...zones],
            activeCount,
          });

          onZoneUpdate?.(activeCount, zones);
          onIntensityUpdate?.(intensity);
          onDancing(dancing);
        }

        previousAvgsRef.current = currentAvgs;

        // Clean up temp photo file
        try { await RNFS.unlink(photo.path); } catch (_) {}
      } catch (error) {
        failureCountRef.current++;
        if (failureCountRef.current >= MAX_FAILURES) {
          console.warn('Too many analysis failures, switching to simulation');
          setUseSimulation(true);
        }
      } finally {
        capturingRef.current = false;
      }
    }, [
      isActive,
      useSimulation,
      onDancing,
      computeZoneAverages,
      simulateMotion,
      onZoneUpdate,
      onIntensityUpdate,
    ]);

    useEffect(() => {
      if (!isActive || !hasPermission || !device || !cameraReady) return;
      const interval = setInterval(analyzeFrame, CAPTURE_INTERVAL);
      return () => clearInterval(interval);
    }, [isActive, hasPermission, device, cameraReady, analyzeFrame]);

    const handleCameraInitialized = useCallback(() => {
      setCameraReady(true);
    }, []);

    if (!hasPermission) {
      return (
        <View style={fullScreen ? styles.containerFull : styles.container}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (!device) {
      return (
        <View style={fullScreen ? styles.containerFull : styles.container}>
          <Text style={styles.text}>No front camera available</Text>
        </View>
      );
    }

    return (
      <View style={fullScreen ? styles.containerFull : styles.container}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          device={device}
          isActive={isActive}
          photo={true}
          video={true}
          audio={false}
          onInitialized={handleCameraInitialized}
        />

        <View style={styles.gridOverlay}>
          {activeZones.map((active, index) => (
            <View
              key={index}
              style={[styles.gridCell, active && styles.gridCellActive]}
            />
          ))}
        </View>

        {useSimulation && (
          <View style={styles.simBadge}>
            <Text style={styles.simText}>SIM MODE</Text>
          </View>
        )}
      </View>
    );
  },
);

export default MotionDetector;

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
  containerFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
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
    borderColor: 'rgba(255, 0, 255, 0.4)',
  },
  gridCellActive: {
    backgroundColor: 'rgba(255, 0, 255, 0.25)',
    borderColor: '#FF00FF',
    borderWidth: 2,
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  simBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  simText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'ShareTechMono',
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
