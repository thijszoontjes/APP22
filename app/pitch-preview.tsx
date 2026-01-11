import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import EditIconSvg from '@/assets/images/edit-icon.svg';
import OpnieuwIconSvg from '@/assets/images/opnieuw-icon.svg';
import PauseIconSvg from '@/assets/images/pause-icon.svg';
import PlayIconSvg from '@/assets/images/play-icon.svg';
import UploadIconSvg from '@/assets/images/upload-icon.svg';
import { getPitches, markPitchUploaded } from '@/constants/pitch-store';
import { createVideoUpload, uploadVideoToMux } from '@/hooks/useVideoApi';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = '#FF8700';

const guessMimeTypeFromUri = (uri: string): string | undefined => {
  const normalized = uri.split('?')[0]?.toLowerCase() ?? '';
  if (normalized.endsWith('.mp4')) return 'video/mp4';
  if (normalized.endsWith('.mov')) return 'video/quicktime';
  if (normalized.endsWith('.m4v')) return 'video/x-m4v';
  return undefined;
};

export default function PitchPreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; facing?: string }>();
  const insets = useSafeAreaInsets();
  const latestUri = getPitches()[0]?.uri ?? null;
  const videoUri = useMemo(() => {
    if (typeof params.uri === 'string' && params.uri.trim().length) {
      return params.uri;
    }
    return latestUri;
  }, [params.uri, latestUri]);

  const videoRef = useRef<VideoView | null>(null);
  const isMountedRef = useRef(true);
  const trimSettingsRef = useRef({ start: 0, end: 0, isApplied: false });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Don't try to pause/cleanup player here - React will handle it
    };
  }, []);

  const player = useVideoPlayer(videoUri, player => {
    // Don't set loop here - let the trim effect manage it
    if (player) {
      player.loop = true;
    }
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'light' | 'trim' | 'sound' | null>(null);
  const [lightValue, setLightValue] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [videoDuration, setVideoDuration] = useState(0);
  const [selectedStart, setSelectedStart] = useState(0);
  const [selectedEnd, setSelectedEnd] = useState(100);
  const [isTrimApplied, setIsTrimApplied] = useState(false);
  const [soundValue, setSoundValue] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  // Manage loop state based on trim - this takes precedence
  useEffect(() => {
    if (!player) return;
    
    try {
      if (isTrimApplied) {
        player.loop = false;
      } else {
        player.loop = true;
      }
    } catch (err) {
      console.warn('Error managing loop state:', err);
    }
  }, [player, isTrimApplied]);

  useEffect(() => {
    if (!player || !videoUri) return;
    
    const start = setTimeout(() => {
      try {
        if (isMountedRef.current) {
          player.play();
        }
      } catch (err) {
        // Player might be released
      }
    }, 500);
    
    return () => {
      clearTimeout(start);
      // Don't call pause here - it can cause "released player" errors
    };
  }, [player, videoUri]);

  // Track video duration - poll for it since it might not be available immediately
  useEffect(() => {
    if (!player || videoDuration > 0) {
      return;
    }
    
    const interval = setInterval(() => {
      try {
        const duration = player.duration;
        if (duration && duration > 0) {
          setVideoDuration(duration * 1000); // Convert to milliseconds
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [player]);

  // Track playing state
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setIsPlaying(player.playing);
    }, 1000);
    return () => clearInterval(interval);
  }, [player]);

  // Update trim settings ref when trim state changes
  useEffect(() => {
    trimSettingsRef.current = {
      start: (selectedStart / 100) * (videoDuration / 1000),
      end: (selectedEnd / 100) * (videoDuration / 1000),
      isApplied: isTrimApplied,
    };
  }, [selectedStart, selectedEnd, isTrimApplied, videoDuration]);

  // Handle trimmed video playback preview with a single robust interval
  useEffect(() => {
    if (!player || videoDuration === 0) {
      return;
    }
    
    let isActive = true;
    
    const interval = setInterval(() => {
      if (!isActive || !isMountedRef.current || !player) {
        return;
      }
      
      try {
        const { start: trimStart, end: trimEnd, isApplied } = trimSettingsRef.current;
        
        if (isApplied && trimStart < trimEnd && videoDuration > 0) {
          const currentTime = player.currentTime;
          
          // If we haven't reached trim start yet, seek to it
          if (currentTime < trimStart) {
            player.currentTime = trimStart;
            if (!player.playing) {
              player.play();
            }
          }
          // If we've passed trim end, loop back to start
          else if (currentTime >= trimEnd) {
            player.currentTime = trimStart;
            player.play();
          }
        }
      } catch (err) {
        // Silently ignore errors - player might be changing
      }
    }, 100);
    
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [player, videoDuration]);

  const togglePlayback = async () => {
    if (!isMountedRef.current || !player) {
      return;
    }
    
    try {
      // Defensive checks
      if (typeof player.playing === 'undefined') {
        return;
      }
      
      // Toggle play/pause with individual error handling
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (err) {
      console.warn('Error toggling playback:', err);
    }
  };

  const restartRecording = () => {
    // Just navigate - let React handle player cleanup
    router.replace({ pathname: '/pitch', params: { facing: params.facing ?? 'front' } });
  };

  const handleUpload = async () => {
    if (isUploading || !videoUri) {
      return;
    }

    try {
      setIsUploading(true);
      const contentType = guessMimeTypeFromUri(videoUri) ?? 'video/mp4';

      // Stap 1: Vraag upload URL aan bij VideoService
      console.log('[PitchPreview] Vraag upload URL aan...');
      const uploadData = await createVideoUpload({
        title: 'Mijn Pitch',
        contentType,
      }); // Backend bepaalt owner automatisch via JWT token

      console.log('[PitchPreview] Upload URL ontvangen:', uploadData.uploadUrl);

      console.log('[PitchPreview] Upload video naar Mux...', {
        uri: videoUri,
        contentType,
      });

      // Stap 2: Upload naar Mux (stream vanaf device storage)
      await uploadVideoToMux(uploadData.uploadUrl, videoUri, contentType);

      // Koppel lokale pitch aan backend videoId (zodat we 'm kunnen tonen terwijl Mux nog verwerkt)
      await markPitchUploaded(videoUri, uploadData.id);

      console.log('[PitchPreview] Video succesvol geupload!');
      
      // Wacht kort zodat backend de video kan indexeren
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Succes!',
        'Je pitch is succesvol geupload en wordt verwerkt.',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Force refresh by going to profile - the profile page will reload videos
            router.replace('/(tabs)/profile');
          }
        }]
      );
    } catch (err: any) {
      console.error('[PitchPreview] Upload error:', err);
      Alert.alert(
        'Upload mislukt',
        err?.message || 'Kon video niet uploaden. Probeer het opnieuw.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyTrim = async () => {
    if (selectedStart !== selectedEnd) {
      setIsTrimApplied(true);
      const startSec = Math.floor((selectedStart / 100) * (videoDuration / 1000));
      const endSec = Math.floor((selectedEnd / 100) * (videoDuration / 1000));
      
      // Seek to trim start and play preview
      if (player) {
        player.currentTime = startSec;
        player.play();
      }
      
      setActiveEditor(null);
      Alert.alert('Trim preview', `${startSec}s - ${endSec}s`);
    }
  };

  const handleRemoveTrim = () => {
    setIsTrimApplied(false);
    setSelectedStart(0);
    setSelectedEnd(100);
    // Reset video to start
    if (player) {
      player.currentTime = 0;
      player.pause();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleExitEdit = () => {
    setIsEditing(false);
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
          <TouchableOpacity
            style={styles.orangeButton}
            activeOpacity={0.9}
            onPress={restartRecording}
            accessibilityRole="button"
            accessibilityLabel="Opnieuw opnemen"
          >
            <OpnieuwIconSvg width={18} height={18} accessible={false} />
            <Text style={styles.orangeText}>Opnieuw opnemen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.videoWrapper}>
        <TouchableOpacity 
          style={styles.video}
          activeOpacity={1}
          onPress={togglePlayback}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Video pauzeren' : 'Video afspelen'}
        >
          <VideoView
            ref={videoRef}
            style={styles.video}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
        </TouchableOpacity>
        
        {/* Brightness Overlay */}
        {lightValue !== 0 && (
          <View
            style={[
              styles.brightnessOverlay,
              {
                backgroundColor: lightValue > 0 ? '#FFFFFF' : '#000000',
                opacity: Math.abs(lightValue) / 150,
              },
            ]}
            pointerEvents="none"
          />
        )}

        <View style={[styles.topBar, { top: Math.max(insets.top + 6, 12) }]}>
          <TouchableOpacity
            style={styles.circleButton}
            activeOpacity={0.85}
            onPress={isEditing ? handleExitEdit : confirmLeave}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Bewerken afsluiten' : 'Terug naar profiel'}
          >
            <ArrowBackSvg width={18} height={18} accessible={false} />
          </TouchableOpacity>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editPill}
              activeOpacity={0.85}
              onPress={handleEdit}
              accessibilityRole="button"
              accessibilityLabel="Bewerk pitch"
            >
              <Text style={styles.editLabel}>Bewerk</Text>
              <EditIconSvg width={20} height={20} accessible={false} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={[styles.editPanel, { paddingBottom: Math.max(insets.bottom + 12, 12) }]}>
            {/* Edit Buttons Row */}
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={[styles.editButton, activeEditor === 'light' && styles.editButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveEditor(activeEditor === 'light' ? null : 'light')}
                accessibilityRole="button"
                accessibilityLabel="Licht aanpassen"
                accessibilityState={{ selected: activeEditor === 'light' }}
              >
                <Text style={[styles.editButtonText, activeEditor === 'light' && { color: '#FFF' }]}>Licht</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, activeEditor === 'trim' && styles.editButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveEditor(activeEditor === 'trim' ? null : 'trim')}
                accessibilityRole="button"
                accessibilityLabel="Video trimmen"
                accessibilityState={{ selected: activeEditor === 'trim' }}
              >
                <Text style={[styles.editButtonText, activeEditor === 'trim' && { color: '#FFF' }]}>Trimmen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, activeEditor === 'sound' && styles.editButtonActive]}
                activeOpacity={0.8}
                onPress={() => setActiveEditor(activeEditor === 'sound' ? null : 'sound')}
                accessibilityRole="button"
                accessibilityLabel="Geluid aanpassen"
                accessibilityState={{ selected: activeEditor === 'sound' }}
              >
                <Text style={[styles.editButtonText, activeEditor === 'sound' && { color: '#FFF' }]}>Geluid</Text>
              </TouchableOpacity>
            </View>

            {/* Light Slider */}
            {activeEditor === 'light' && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Helderheid</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderValue}>-</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={-100}
                    maximumValue={100}
                    value={lightValue}
                    onValueChange={(value) => setLightValue(Math.round(value))}
                    minimumTrackTintColor={ORANGE}
                    maximumTrackTintColor="#555"
                    thumbTintColor={ORANGE}
                    accessibilityLabel="Helderheid"
                    accessibilityValue={{ min: -100, max: 100, now: lightValue }}
                  />
                  <Text style={styles.sliderValue}>+</Text>
                </View>
                <Text style={styles.sliderValueDisplay}>{lightValue > 0 ? '+' : ''}{lightValue}</Text>
              </View>
            )}
            {/* Trim Controls - Range Slider */}
            {activeEditor === 'trim' && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Video knippen</Text>
                <Text style={styles.trimRangeText}>
                  {Math.floor((selectedStart / 100) * (videoDuration / 1000))}s - {Math.floor((selectedEnd / 100) * (videoDuration / 1000))}s
                </Text>
                
                <View style={styles.rangeSliderContainer}>
                  <Text style={styles.trimLabelSimple}>Begin</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={99}
                    value={selectedStart}
                    onValueChange={(value) => {
                      const rounded = Math.round(value);
                      if (rounded < selectedEnd) {
                        setSelectedStart(rounded);
                      }
                    }}
                    minimumTrackTintColor={ORANGE}
                    maximumTrackTintColor="#DDD"
                    thumbTintColor={ORANGE}
                    accessibilityLabel="Trim begin"
                    accessibilityValue={{ min: 0, max: 99, now: selectedStart }}
                  />
                  
                  <Text style={styles.trimLabelSimple}>Einde</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={100}
                    value={selectedEnd}
                    onValueChange={(value) => {
                      const rounded = Math.round(value);
                      if (rounded > selectedStart) {
                        setSelectedEnd(rounded);
                      }
                    }}
                    minimumTrackTintColor={ORANGE}
                    maximumTrackTintColor="#DDD"
                    thumbTintColor={ORANGE}
                    accessibilityLabel="Trim einde"
                    accessibilityValue={{ min: 1, max: 100, now: selectedEnd }}
                  />
                </View>

                <View style={styles.trimButtonRow}>
                  {isTrimApplied && (
                    <TouchableOpacity
                      style={[styles.trimButton, styles.trimButtonRemove]}
                      onPress={handleRemoveTrim}
                      accessibilityRole="button"
                      accessibilityLabel="Trim verwijderen"
                    >
                      <Text style={styles.trimButtonText}>Verwijderen</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.trimButton, styles.trimButtonApply]}
                    onPress={handleApplyTrim}
                    accessibilityRole="button"
                    accessibilityLabel="Trim toepassen"
                  >
                    <Text style={styles.trimButtonText}>Toepassen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Sound/Volume Slider */}
            {activeEditor === 'sound' && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Geluid</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderValue}>🔇</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    value={soundValue * 100}
                    onValueChange={(value) => {
                      setSoundValue(value / 100);
                      if (player) {
                        player.volume = value / 100;
                      }
                    }}
                    minimumTrackTintColor={ORANGE}
                    maximumTrackTintColor="#555"
                    thumbTintColor={ORANGE}
                    accessibilityLabel="Geluid"
                    accessibilityValue={{ min: 0, max: 100, now: Math.round(soundValue * 100) }}
                  />
                  <Text style={styles.sliderValue}>🔊</Text>
                </View>
                <Text style={styles.sliderValueDisplay}>{Math.round(soundValue * 100)}%</Text>
              </View>
            )}

            {/* Done Button */}
            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.9}
              onPress={handleExitEdit}
              accessibilityRole="button"
              accessibilityLabel="Klaar met bewerken"
            >
              <Text style={styles.doneButtonText}>Klaar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 4, 12) }]}>
            <TouchableOpacity
              style={[styles.orangeButton, styles.wideButton]}
              activeOpacity={0.9}
              onPress={restartRecording}
              accessibilityRole="button"
              accessibilityLabel="Opnieuw opnemen"
            >
              <Text style={styles.orangeText}>Opnieuw</Text>
              <OpnieuwIconSvg width={18} height={18} accessible={false} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.orangeButton, styles.playButton]}
              activeOpacity={0.9}
              onPress={togglePlayback}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pauzeer video' : 'Speel video af'}
            >
              {isPlaying ? (
                <PauseIconSvg width={16} height={16} accessible={false} />
              ) : (
                <PlayIconSvg width={16} height={16} accessible={false} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.orangeButton, styles.wideButton, isUploading && styles.disabledButton]} 
              activeOpacity={0.9} 
              onPress={handleUpload}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Uploaden"
              accessibilityState={{ disabled: isUploading }}
            >
              <Text style={styles.orangeText}>{isUploading ? 'Uploaden...' : 'Uploaden'}</Text>
              {!isUploading && <UploadIconSvg width={18} height={18} accessible={false} />}
            </TouchableOpacity>
          </View>
        )}
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
  brightnessOverlay: {
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
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 12,
  },
  orangeButton: {
    height: 42,
    borderRadius: 8,
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  wideButton: {
    flex: 0.92,
    paddingHorizontal: 10,
  },
  playButton: {
    width: 42,
    height: 42,
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
  editPanel: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  editorSection: {
    gap: 8,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2233',
  },
  doneButton: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2233',
  },
  sliderContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2233',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: ORANGE,
    width: 24,
    textAlign: 'center',
  },
  sliderValueDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    marginTop: 4,
  },
  trimControlSimple: {
    gap: 8,
    marginBottom: 12,
  },
  trimLabelSimple: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
  },
  rangeSliderContainer: {
    gap: 12,
    marginVertical: 12,
  },
  trimRangeText: {
    fontSize: 16,
    fontWeight: '700',
    color: ORANGE,
    textAlign: 'center',
    marginBottom: 8,
  },
  trimInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2233',
    textAlign: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  trimButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  trimButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trimButtonApply: {
    backgroundColor: ORANGE,
  },
  trimButtonRemove: {
    backgroundColor: '#FF6B6B',
  },
  trimButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
