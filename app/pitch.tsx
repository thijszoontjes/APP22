import AppHeader from '@/components/app-header';
import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function PitchRecorder() {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const autoRequested = useRef(false);

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

  const requestMic = async () => {
    try {
      setRequesting(true);
      const result = await Camera.requestMicrophonePermissionsAsync();
      if (result.status !== 'granted') {
        Alert.alert('Toestemming nodig', 'Sta microfoontoegang toe om je pitch op te nemen.');
        setHasPermissions(false);
        return;
      }
      const cam = await Camera.getCameraPermissionsAsync();
      setHasPermissions(result.status === 'granted' && cam.status === 'granted');
    } catch (err) {
      console.warn('Mic permission request failed', err);
      Alert.alert('Fout', 'Kon microfoontoestemming niet opvragen. Probeer opnieuw.');
    } finally {
      setRequesting(false);
    }
  };

  const requestCamera = async () => {
    try {
      setRequesting(true);
      const result = await Camera.requestCameraPermissionsAsync();
      if (result.status !== 'granted') {
        Alert.alert('Toestemming nodig', 'Sta camera-toegang toe om je pitch op te nemen.');
        setHasPermissions(false);
        return;
      }
      const mic = await Camera.getMicrophonePermissionsAsync();
      setHasPermissions(result.status === 'granted' && mic.status === 'granted');
    } catch (err) {
      console.warn('Camera permission request failed', err);
      Alert.alert('Fout', 'Kon cameratoestemming niet opvragen. Probeer opnieuw.');
    } finally {
      setRequesting(false);
    }
  };

  const requestBoth = async () => {
    try {
      setRequesting(true);
      const mic = await Camera.requestMicrophonePermissionsAsync();
      const cam = await Camera.requestCameraPermissionsAsync();
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

  if (hasPermissions) {
    return (
      <View style={styles.fullscreenCamera}>
        <CameraView style={styles.cameraView} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Toestemmingen"
        leading={
          <Pressable onPress={() => router.back()} style={styles.backCircle} accessibilityRole="button">
            <ArrowBackSvg width={18} height={18} />
          </Pressable>
        }
      />

      <View style={styles.body}>
        <Text style={styles.intro}>
          Om jouw videopitch op te nemen, is toegang tot de camera en microfoon vereist.{'\n'}
          Geef hieronder toestemming om deze functies te gebruiken. Je kunt deze toestemmingen op elk moment intrekken via de instellingen van je telefoon.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.permissionButton}
            onPress={requestMic}
            disabled={requesting}
          >
            <Text style={styles.permissionText}>Ik geef toestemming om mijn microfoon te gebruiken</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.permissionButton}
            onPress={requestCamera}
            disabled={requesting}
          >
            <Text style={styles.permissionText}>Ik geef toestemming om mijn camera te gebruiken</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullscreenCamera: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
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
