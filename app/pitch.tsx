import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import CameraFlipSvg from '@/assets/images/camera-icon.svg';
import FlashSvg from '@/assets/images/flash-icon.svg';
import FlashOffSvg from '@/assets/images/flash-off-icon.svg';
import { addPitch } from '@/constants/pitch-store';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#FF8700';
const COUNTDOWN_START = 60;

export default function PitchRecorder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ facing?: string }>();
  const initialFacing = params.facing === 'back' ? 'back' : 'front';
  const [requesting, setRequesting] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [facing, setFacing] = useState<CameraType>(initialFacing as CameraType);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const QUESTIONS = ['Wie ben je?', 'Wat breng je?', 'Wat zoek je?'];
  const autoRequested = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const [cam, mic] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        Camera.getMicrophonePermissionsAsync(),
      ]);
      setHasPermissions(cam.status === 'granted' && mic.status === 'granted');
    };
    checkPermissions();
  }, []);

  const requestBoth = async () => {
    try {
      setRequesting(true);
      const [mic, cam] = await Promise.all([
        Camera.requestMicrophonePermissionsAsync(),
        Camera.requestCameraPermissionsAsync(),
      ]);
      setHasPermissions(mic.status === 'granted' && cam.status === 'granted');
      if (mic.status !== 'granted' || cam.status !== 'granted') {
        Alert.alert('Toestemming nodig', 'Sta camera- en microfoontoegang toe om je pitch op te nemen.');
      }
    } catch (err) {
      console.warn('Permission request failed', err);
      Alert.alert('Fout', 'Kon permissies niet opvragen. Probeer opnieuw.');
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (!hasPermissions && !autoRequested.current) {
      autoRequested.current = true;
      requestBoth();
    }
  }, [hasPermissions]);

  useEffect(() => {
    if (facing === 'front' && torchEnabled) {
      setTorchEnabled(false);
    }
  }, [facing, torchEnabled]);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = () => {
    stopCountdown();
    setCountdown(COUNTDOWN_START);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const finishRecording = () => {
    stopCountdown();
    setIsRecording(false);
    setCountdown(COUNTDOWN_START);
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) {
      return;
    }
    try {
      setIsRecording(true);
      startCountdown();
      const result = await cameraRef.current.recordAsync({
        maxDuration: COUNTDOWN_START,
        mute: false,
        videoCodec: 'h264',
        videoBitrate: 500000,
        audioCodec: 'aac',
        audioBitrate: 32000,
      });
      if (result?.uri) {
        await addPitch(result.uri);
        router.replace({ pathname: '/pitch-preview', params: { uri: result.uri, facing } });
      }
    } catch (err) {
      console.warn('Recording failed', err);
      Alert.alert('Fout', 'Kon je opname niet starten. Probeer opnieuw.');
    } finally {
      finishRecording();
    }
  };

  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }
    stopCountdown();
    setIsRecording(false);
    cameraRef.current?.stopRecording();
  }, [isRecording, stopCountdown]);

  useEffect(() => {
    if (countdown === 0 && isRecording) {
      stopRecording();
    }
  }, [countdown, isRecording, stopRecording]);

  useEffect(() => {
    return () => {
      stopCountdown();
      cameraRef.current?.stopRecording();
    };
  }, [stopCountdown]);

  const formatTime = () => {
    if (countdown === COUNTDOWN_START) {
      return '00:60';
    }
    return `00:${String(Math.max(countdown, 0)).padStart(2, '0')}`;
  };

  const currentQuestion = QUESTIONS[Math.min(Math.floor((COUNTDOWN_START - countdown) / 15), QUESTIONS.length - 1)];

  if (!hasPermissions) {
    return (
      <View style={styles.permissionContainer}>
        <SafeAreaView style={styles.permissionInner}>
          <View style={styles.permissionHeader}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backCircle}
              accessibilityRole="button"
              accessibilityLabel="Terug"
            >
              <ArrowBackSvg width={18} height={18} accessible={false} />
            </Pressable>
            <Text style={styles.permissionTitle}>Toestemmingen</Text>
            <View style={styles.backCircle} accessible={false} />
          </View>
          <View style={styles.permissionBody}>
            <Text style={styles.intro}>
              Om jouw videopitch op te nemen, is toegang tot de camera en microfoon vereist.{'\n'}
              Geef hieronder toestemming om deze functies te gebruiken. Je kunt deze toestemmingen op elk moment
              intrekken via de instellingen van je telefoon.
            </Text>

            <View style={styles.buttons}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.permissionButton}
                onPress={requestBoth}
                disabled={requesting}
                accessibilityRole="button"
                accessibilityLabel="Sta camera en microfoon toe"
                accessibilityState={{ disabled: requesting }}
              >
                <Text style={styles.permissionText}>Sta camera en microfoon toe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.recorderContainer}>
      <CameraView
        ref={ref => {
          cameraRef.current = ref;
        }}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
        enableTorch={torchEnabled && facing === 'back'}
        accessible={false}
      />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (isRecording) {
                stopRecording();
              }
              router.back();
            }}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <ArrowBackSvg width={20} height={20} accessible={false} />
          </Pressable>
          <View style={styles.timerBlock}>
            <View style={styles.timerBadge}>
              {isRecording ? <View style={styles.recordDot} /> : null}
              <Text style={styles.timerText}>{formatTime()}</Text>
            </View>
            {isRecording ? <Text style={styles.questionText}>{currentQuestion}</Text> : null}
          </View>
          <Pressable
            onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back'))}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Camera wisselen"
          >
            <CameraFlipSvg width={22} height={22} color="#1A2233" accessible={false} />
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Pitch opslaan' : 'Pitch opnemen'}
            accessibilityState={{ selected: isRecording }}
          >
            <Text style={styles.recordButtonText}>{isRecording ? 'Pitch opslaan' : 'Pitch opnemen'}</Text>
          </TouchableOpacity>
          <Pressable
            onPress={() => setTorchEnabled(prev => !prev)}
            style={[
              styles.bottomFlashButton,
              torchEnabled && styles.flashButtonActive,
              facing === 'front' && styles.flashButtonDisabled,
            ]}
            disabled={facing === 'front'}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? 'Zaklamp uit' : 'Zaklamp aan'}
            accessibilityState={{ selected: torchEnabled, disabled: facing === 'front' }}
          >
            {torchEnabled ? (
              <FlashSvg width={32} height={32} color={ORANGE} accessible={false} />
            ) : (
              <FlashOffSvg width={32} height={32} color="#fff" accessible={false} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  recorderContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 26,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBlock: {
    alignItems: 'center',
    gap: 10,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  timerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  bottomBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 6,
    position: 'relative',
  },
  flashButtonActive: {
    backgroundColor: 'rgba(255,135,0,0.18)',
  },
  flashButtonDisabled: {
    opacity: 0.4,
  },
  bottomFlashButton: {
    position: 'absolute',
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    alignSelf: 'center',
    width: '64%',
    maxWidth: 300,
    backgroundColor: ORANGE,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#D85E00',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  sideSpacer: {
    width: 52,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  permissionInner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2233',
  },
  permissionBody: {
    flex: 1,
    paddingTop: 32,
  },
  backCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    fontSize: 14.5,
    color: '#1A2233',
    lineHeight: 20,
    marginBottom: 26,
    fontWeight: '700',
  },
  buttons: {
    gap: 14,
    alignItems: 'center',
  },
  permissionButton: {
    width: '90%',
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});
