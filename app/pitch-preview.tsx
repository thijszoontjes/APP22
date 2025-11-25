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
  const params = useLocalSearchParams<{ uri?: string; facing?: string }>();
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
    const start = setTimeout(() => {
      if (videoRef.current && videoUri) {
        videoRef.current.playAsync().catch(err => console.warn('Autoplay failed', err));
      }
    }, 80);
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
    if (!player) return;
    const status = await player.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await player.pauseAsync();
    } else {
      await player.playAsync();
    }
  };

  const restartRecording = () => {
    router.replace({ pathname: '/pitch', params: { facing: params.facing ?? 'front' } });
  };

  const handleUpload = () => {
    router.replace('/(tabs)/profile');
  };

  const confirmLeave = () => {
    Alert.alert('Weet je het zeker?', 'Je verlaat deze preview en gaat terug.', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Terug', style: 'destructive', onPress: () => router.replace('/(tabs)/profile') },
    ]);
  };

  if (!videoUri) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Geen pitch gevonden</Text>
          <TouchableOpacity style={styles.orangeButton} activeOpacity={0.9} onPress={restartRecording}>
            <OpnieuwIconSvg width={18} height={18} />
            <Text style={styles.orangeText}>Opnieuw opnemen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.videoWrapper}>
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
        />

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} activeOpacity={0.85} onPress={confirmLeave}>
            <ArrowBackSvg width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editPill} activeOpacity={0.85}>
            <Text style={styles.editLabel}>Bewerk</Text>
            <EditIconSvg width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.orangeButton, styles.wideButton]} activeOpacity={0.9} onPress={restartRecording}>
            <Text style={styles.orangeText}>Opnieuw</Text>
            <OpnieuwIconSvg width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.orangeButton, styles.playButton]} activeOpacity={0.9} onPress={togglePlayback}>
            {isPlaying ? <PauseIconSvg width={16} height={16} /> : <PlayIconSvg width={16} height={16} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.orangeButton, styles.wideButton]} activeOpacity={0.9} onPress={handleUpload}>
            <Text style={styles.orangeText}>Uploaden</Text>
            <UploadIconSvg width={18} height={18} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  editLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  orangeButton: {
    height: 46,
    borderRadius: 8,
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  wideButton: {
    flex: 1,
    paddingHorizontal: 10,
  },
  playButton: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    borderRadius: 10,
  },
  orangeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2233',
  },
});
