import SettingIconSvg from '@/assets/images/setting-icon.svg';
import AppHeader from '@/components/app-header';
import { getPitches, subscribe } from '@/constants/pitch-store';
import { useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';

const tabLabels = ['Eigen video', 'Gelikte video', 'Favorieten'];
const ORANGE = '#FF8700';

// Video Thumbnail Component - Only loads when visible
function VideoThumbnail({ uri, onPress, isVisible }: { uri: string; onPress: () => void; isVisible: boolean }) {
  const player = useVideoPlayer(isVisible ? uri : '');

  return (
    <TouchableOpacity 
      style={styles.videoThumbnailContainer}
      activeOpacity={0.8}
      onPress={onPress}>
      {isVisible ? (
        <VideoView
          style={styles.videoThumbnail}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <View style={[styles.videoThumbnail, { backgroundColor: '#e0e0e0' }]} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [routes] = useState([
    { key: 'first', title: tabLabels[0] },
    { key: 'second', title: tabLabels[1] },
    { key: 'third', title: tabLabels[2] },
  ]);
  const [pitches, setPitches] = useState(getPitches());
  const [visibleIndices, setVisibleIndices] = useState(new Set<number>([0, 1, 2])); // Start with first 3 visible

  // Separate player for modal - only created when video is selected
  const modalPlayer = useVideoPlayer(selectedVideoUri || '');

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setPitches(getPitches());
    });
    return unsubscribe;
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // Calculate which videos should be visible (roughly 2 rows above/below viewport)
    const visibleIndicesSet = new Set<number>();
    const itemHeight = 140; // Approximate height of video thumbnail + spacing
    const rowSize = 3; // 3 columns
    
    const startIndex = Math.max(0, Math.floor((offsetY - 280) / itemHeight) * rowSize);
    const endIndex = Math.min(pitches.length - 1, Math.ceil((offsetY + layoutHeight + 280) / itemHeight) * rowSize);
    
    for (let i = startIndex; i <= endIndex; i++) {
      visibleIndicesSet.add(i);
    }
    
    setVisibleIndices(visibleIndicesSet);
  }, [pitches.length]);

  const renderOwnVideos = () => {
    if (pitches.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.tabContentText}>Nog geen video's opgeslagen.</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.videosGridContainer}
        style={styles.videosScroll}
        onScroll={handleScroll}
        scrollEventThrottle={200}>
        <View style={styles.videosGrid}>
          {pitches.map((pitch, i) => (
            <VideoThumbnail 
              key={i} 
              uri={pitch.uri}
              onPress={() => setSelectedVideoUri(pitch.uri)}
              isVisible={visibleIndices.has(i)}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Profiel"
        actions={[
          <View key="settings" style={styles.optionCircle}>
            <SettingIconSvg width={22} height={22} />
          </View>,
        ]}
      />
      <View style={styles.profilePicContainer}>
        <View style={styles.profilePicCircle} />
      </View>
      <View style={styles.profileInfoContainer}>
        <Text style={styles.profileName}>Anna Vermeer</Text>
        <Text style={styles.profileDetails}>+31 465436443</Text>
        <Text style={styles.profileDetails}>Anna01@gmail.com</Text>
      </View>
      <View style={styles.pitchRow}>
        <TouchableOpacity style={styles.pitchButton} activeOpacity={0.9} onPress={() => router.push('/pitch')}>
          <Text style={styles.pitchButtonText}>Pitch opnemen</Text>
        </TouchableOpacity>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={({ route }) => {
          if (route.key === 'first') {
            return (
              <View style={styles.tabContentContainer}>
{renderOwnVideos()}
              </View>
            );
          }
          if (route.key === 'second') {
            return (
              <View style={styles.tabContentContainer}>
                <Text style={styles.tabContentText}>Tab: Gelikte video</Text>
              </View>
            );
          }
          return (
            <View style={styles.tabContentContainer}>
              <Text style={styles.tabContentText}>Tab: Favorieten</Text>
            </View>
          );
        }}
        onIndexChange={setIndex}
        initialLayout={{ width: 360 }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#FF8700', height: 4 }}
            style={{ backgroundColor: '#fff' }}
            tabStyle={{ paddingVertical: 12 }}
            activeColor="#1A2233"
            inactiveColor="#5d5d5d"
            pressColor="#FF8700"
          />
        )}
      />
      <Modal 
        visible={selectedVideoUri !== null} 
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedVideoUri(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedVideoUri(null)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          {selectedVideoUri && (
            <VideoView
              style={styles.fullscreenVideo}
              player={modalPlayer}
              contentFit="contain"
              fullscreenOptions={{ enterFullscreenButtonPressed: true }}
              nativeControls
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  optionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 24,
    minHeight: 120,
  },
  profilePicCircle: {
    width: 154,
    aspectRatio: 1,
    borderRadius: 77,
    backgroundColor: '#FF8700',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pitchRow: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  pitchButton: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2233',
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  profileDetails: {
    fontSize: 15,
    color: '#5d5d5d',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabContentText: {
    fontSize: 18,
    color: '#1A2233',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videosScroll: {
    flex: 1,
  },
  videosGridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  videoThumbnailContainer: {
    width: '28%',
    aspectRatio: 2 / 3,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
