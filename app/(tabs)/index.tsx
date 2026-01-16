import FilterIconSvg from '@/assets/images/filter-icon.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import { AppHeader } from '@/components/app-header';
import VideoFeedItem from '@/components/video-feed-item';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';

import { clearAuthToken, getHomeHintSeen, setHomeHintSeen } from '@/hooks/authStorage';
import { ensureValidSession } from '@/hooks/useAuthApi';
import { getVideoFeed, type FeedItem } from '@/hooks/useVideoApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomePage() {
  const router = useRouter();
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [cardHeight, setCardHeight] = useState(SCREEN_HEIGHT);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadHintState = async () => {
      const seen = await getHomeHintSeen();
      setShowScrollHint(!seen);
    };
    loadHintState();
  }, []);

  // Reload video feed when screen is focused (e.g., after logout/login)
  useFocusEffect(
    useCallback(() => {
      loadVideoFeed();
    }, [])
  );

  useEffect(() => {
    // Valideer sessie bij het laden van de pagina
    const initSession = async () => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        setError('Sessie verlopen. Log opnieuw in.');
        setLoading(false);
        router.replace('/login');
        return;
      }
      loadVideoFeed();
    };
    initSession();

    // Check sessie elke 2 minuten om tokens proactief te refreshen
    const sessionCheckInterval = setInterval(async () => {
      const isValid = await ensureValidSession();
      if (!isValid) {
        clearInterval(sessionCheckInterval);
        setError('Sessie verlopen. Log opnieuw in.');
        router.replace('/login');
      }
    }, 2 * 60 * 1000); // Elke 2 minuten

    return () => clearInterval(sessionCheckInterval);
  }, [router]);

  const loadVideoFeed = async () => {
    try {
      setLoading(true);
      setError('');
      const feed = await getVideoFeed(20);
      setVideos(feed.items);
    } catch (err: any) {
      setError(err?.message || 'Kon videos niet laden');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError('');
      const feed = await getVideoFeed(20);
      setVideos(feed.items);
    } catch (err: any) {
      setError(err?.message || 'Kon videos niet laden');
    } finally {
      setRefreshing(false);
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveVideoIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Ontdek het netwerk"
          leading={
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.85}
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel="Zoeken"
            >
              <SearchIconSvg width={26} height={26} accessible={false} />
            </TouchableOpacity>
          }
          actions={[
            <TouchableOpacity
              key="filter"
              style={styles.headerIcon}
              activeOpacity={0.85}
              onPress={() => router.push('/filters')}
              accessibilityRole="button"
              accessibilityLabel="Filters"
            >
              <FilterIconSvg width={26} height={26} accessible={false} />
            </TouchableOpacity>,
          ]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8700" />
          <Text style={styles.loadingText}>Video&apos;s laden...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Ontdek het netwerk"
          leading={
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.85}
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel="Zoeken"
            >
              <SearchIconSvg width={26} height={26} accessible={false} />
            </TouchableOpacity>
          }
          actions={[
            <TouchableOpacity
              key="filter"
              style={styles.headerIcon}
              activeOpacity={0.85}
              onPress={() => router.push('/filters')}
              accessibilityRole="button"
              accessibilityLabel="Filters"
            >
              <FilterIconSvg width={26} height={26} accessible={false} />
            </TouchableOpacity>,
          ]}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVideoFeed} accessibilityRole="button" accessibilityLabel="Opnieuw proberen">
            <Text style={styles.retryButtonText}>Opnieuw proberen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => { await clearAuthToken(); router.replace('/login'); }}
            accessibilityRole="button"
            accessibilityLabel="Uitloggen"
          >
            <Text style={styles.logoutButtonText}>Uitloggen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Ontdek het netwerk"
        leading={
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.85}
            onPress={() => router.push('/search')}
            accessibilityRole="button"
            accessibilityLabel="Zoeken"
          >
            <SearchIconSvg width={26} height={26} accessible={false} />
          </TouchableOpacity>
        }
        actions={[
          <TouchableOpacity
            key="filter"
            style={styles.headerIcon}
            activeOpacity={0.85}
            onPress={() => router.push('/filters')}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <FilterIconSvg width={26} height={26} accessible={false} />
          </TouchableOpacity>,
        ]}
      />
      <View style={styles.content}>
        <View style={styles.hintHitbox} onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}>
            {showScrollHint && (
              <TouchableOpacity
                style={styles.hintOverlay}
                activeOpacity={0.85}
                onPress={() => {
                  setShowScrollHint(false);
                  setHomeHintSeen();
                }}
                accessibilityRole="button"
                accessibilityLabel="Hint sluiten"
              >
                <View style={styles.hintContent}>
                  <Text style={styles.hintText}>Swipe omhoog om nieuwe video&apos;s te ontdekken</Text>
                </View>
              </TouchableOpacity>
            )}
          <FlatList
            ref={flatListRef}
            data={videos}
            renderItem={({ item, index }) => (
              <VideoFeedItem item={item} isActive={index === activeVideoIndex} cardHeight={cardHeight} />
            )}
            keyExtractor={(item) => item.id.toString()}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={cardHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: cardHeight,
              offset: cardHeight * index,
              index,
            })}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyFeedText}>
                  Momenteel geen video&apos;s beschikbaar.
                </Text>
                <Text style={[styles.emptyFeedText, { fontSize: 14, marginTop: 8, opacity: 0.8 }]}>
                  Nieuwe video&apos;s kunnen enkele minuten duren om te verwerken.
                  Trek omlaag om te verversen.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadVideoFeed} accessibilityRole="button" accessibilityLabel="Opnieuw laden">
                  <Text style={styles.retryButtonText}>Opnieuw laden</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  hintHitbox: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF8700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  hintContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,135,0,0.9)',
    paddingVertical: 20,
    borderRadius: 12,
  },
  hintText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyFeed: {
    height: SCREEN_HEIGHT * 0.65,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyFeedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
