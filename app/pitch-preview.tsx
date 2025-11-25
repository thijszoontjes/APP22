import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import EditIconSvg from '@/assets/images/edit-icon.svg';
import OpnieuwIconSvg from '@/assets/images/opnieuw-icon.svg';
import PauseIconSvg from '@/assets/images/pause-icon.svg';
import PlayIconSvg from '@/assets/images/play-icon.svg';
import UploadIconSvg from '@/assets/images/upload-icon.svg';
import { getPitches } from '@/constants/pitch-store';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#FF8700';

export default function PitchPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const latestUri = getPitches()[0]?.uri ?? null;
  const videoUri = useMemo(() => {
    if (typeof params.uri === 'string' && params.uri.trim().length) {
      return params.uri;
    }
    return latestUri;
  }, [params.uri, latestUri]);

  const videoRef = useRef<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Autoplay once the video ref is ready.
    const start = setTimeout(() => {
      if (videoRef.current && videoUri) {
        videoRef.current.playAsync().catch(err => console.warn('Autoplay failed', err));
      }
    }, 60);
    return () => clearTimeout(start);
  }, [videoUri]);

  const handleStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    setIsPlaying(status.isPlaying ?? false);
  };

  const togglePlayback = async () => {
    const player = videoRef.current;
    if (!player) {
      return;
    }
    const status = await player.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }
    if (status.isPlaying) {
      await player.pauseAsync();
    } else {
      await player.playAsync();
    }
  };

  const restartRecording = () => {
    router.replace('/pitch');
  };

  const handleUpload = () => {
    Alert.alert('Uploaden', 'We uploaden je pitch direct. Laat dit scherm openstaan totdat de upload klaar is.');
  };

  const confirmLeave = () => {
    Alert.alert('Weet je het zeker?', 'Als je teruggaat verlaat je deze pagina en sluit je de preview.', [
      { text: 'Blijven', style: 'cancel' },
      { text: 'Ja, terug', style: 'destructive', onPress: () => router.replace('/(tabs)/profile') },
    ]);
  };

  if (!videoUri) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.circleButton} activeOpacity={0.85} onPress={confirmLeave}>
            <ArrowBackSvg width={18} height={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pitch opgeslagen</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Geen pitch gevonden</Text>
          <Text style={styles.emptyText}>Neem een nieuwe pitch op om een preview te zien.</Text>
          <TouchableOpacity style={styles.uploadButton} activeOpacity={0.9} onPress={restartRecording}>
            <OpnieuwIconSvg width={20} height={20} />
            <Text style={styles.uploadText}>Nieuwe pitch opnemen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.circleButton} activeOpacity={0.85} onPress={confirmLeave}>
          <ArrowBackSvg width={18} height={18} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pitch opgeslagen</Text>
          <Text style={styles.headerSubtitle}>Speelt automatisch af</Text>
        </View>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.85}>
          <EditIconSvg width={18} height={18} />
          <Text style={styles.editText}>Bewerken</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.heroTitle}>Je pitch staat klaar</Text>
        <Text style={styles.heroSubtitle}>Bekijk 'm terug, neem opnieuw op of upload direct.</Text>

        <View style={styles.videoCard}>
          <Video
            ref={ref => {
              videoRef.current = ref;
            }}
            style={styles.video}
            source={{ uri: videoUri }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            onPlaybackStatusUpdate={handleStatusUpdate}
            usePoster={false}
          />
          <TouchableOpacity style={styles.playPauseButton} activeOpacity={0.9} onPress={togglePlayback}>
            {isPlaying ? <PauseIconSvg width={26} height={26} /> : <PlayIconSvg width={26} height={26} />}
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.9} onPress={restartRecording}>
            <OpnieuwIconSvg width={20} height={20} />
            <Text style={styles.secondaryText}>Opnieuw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.9} onPress={togglePlayback}>
            {isPlaying ? <PauseIconSvg width={20} height={20} /> : <PlayIconSvg width={20} height={20} />}
            <Text style={styles.secondaryText}>{isPlaying ? 'Pauzeer' : 'Speel af'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.uploadButton} activeOpacity={0.9} onPress={handleUpload}>
          <UploadIconSvg width={20} height={20} />
          <Text style={styles.uploadText}>Direct uploaden</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2233',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#5A6270',
    marginTop: 2,
    fontWeight: '600',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  editText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2233',
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 20,
    gap: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A2233',
    marginTop: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#5D6372',
    fontWeight: '600',
    lineHeight: 20,
  },
  videoCard: {
    width: '100%',
    backgroundColor: '#0E0E12',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    position: 'relative',
  },
  video: {
    width: '86%',
    maxWidth: 360,
    aspectRatio: 9 / 16,
    borderRadius: 14,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  playPauseButton: {
    position: 'absolute',
    right: 22,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E4EA',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2233',
  },
  uploadButton: {
    marginTop: 4,
    width: '100%',
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2233',
  },
  emptyText: {
    fontSize: 14,
    color: '#5D6372',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});
