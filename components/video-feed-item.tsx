import ChatIconHomepageSvg from '@/assets/images/chat-icon-homepage.svg';
import HeartIconSvg from '@/assets/images/heart-icon.svg';
import HeartTrueIconSvg from '@/assets/images/heart-true-icon.svg';
import LikedIconSvg from '@/assets/images/liked-icon.svg';
import NonLikedIconSvg from '@/assets/images/non-liked-icon.svg';
import { getPlayableVideoUrl, type FeedItem } from '@/hooks/useVideoApi';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const ORANGE = '#FF8700';

// Functie om Unix timestamp te formatteren naar datum en relatieve tijd
function getRelativeTime(createdAt?: string | number): string {
  if (!createdAt) {
    return 'Nu beschikbaar';
  }
  
  try {
    // Converteer Unix timestamp (getal in seconden) naar milliseconden
    const timestamp = typeof createdAt === 'number' 
      ? createdAt * 1000  // Unix timestamp in seconden -> milliseconden
      : parseInt(createdAt, 10) * 1000;
    
    const created = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) return 'Zojuist';
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minuut' : 'minuten'} geleden`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'uur' : 'uren'} geleden`;
    if (diffDays === 1) return 'Gisteren';
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    
    // Toon datum voor oudere videos (YYYY-MM-DD formaat)
    const year = created.getFullYear();
    const month = String(created.getMonth() + 1).padStart(2, '0');
    const day = String(created.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.warn('[VideoFeedItem] Fout bij formatteren createdAt:', createdAt, e);
    return 'Nu beschikbaar';
  }
}

interface VideoFeedItemProps {
  item: FeedItem;
  isActive: boolean;
  cardHeight?: number;
}

export default function VideoFeedItem({ item, isActive, cardHeight }: VideoFeedItemProps) {
  const router = useRouter();
  const isScreenFocused = useIsFocused();
  const [liked, setLiked] = useState(item.liked);
  const [hearted, setHearted] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const heartScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const likeTranslateY = useRef(new Animated.Value(0)).current;
  const boundedHeight = cardHeight || SCREEN_HEIGHT;
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'loading' | 'readyToPlay' | 'error'>('idle');
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  // Gebruik signedUrl (van backend), anders HLS stream of progressive
  const videoSource = getPlayableVideoUrl(item);

  // Video source bepaald

  const player = useVideoPlayer(videoSource ?? null, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    setHasFirstFrame(false);
  }, [videoSource]);

  useEffect(() => {
    setPlayerStatus(player.status);
    const sub = player.addListener('statusChange', (event) => {
      setPlayerStatus(event.status);
    });
    return () => {
      sub.remove();
    };
  }, [player]);

  useEffect(() => {
    const shouldPlay = !!videoSource && playerStatus !== 'error' && isActive && isScreenFocused;
    if (shouldPlay) {
      try {
        player.muted = false;
        player.play();
      } catch (error) {
        console.log('[VideoFeedItem] Error playing video:', error);
      }
    } else {
      try {
        player.muted = true;
        player.pause();
      } catch (error) {
        // Ignore pause errors when component is unmounting
        console.log('[VideoFeedItem] Error pausing video (likely unmounting):', error);
      }
    }
  }, [isActive, player, videoSource, isScreenFocused, playerStatus]);

  useEffect(() => {
    return () => {
      // Ensure audio stops when the card unmounts (e.g., when scrolled far away)
      try {
        player.pause();
      } catch (error) {
        // Ignore errors during unmount
        console.log('[VideoFeedItem] Error pausing on unmount (expected):', error);
      }
    };
  }, [player]);

  const handleHeartPress = () => {
    setHearted(!hearted);
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  };

  const handleLikePress = () => {
    const willLike = !liked;
    setLiked(willLike);
    setLikeCount((prev) => (willLike ? prev + 1 : prev - 1));

    if (willLike) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(likeScale, {
            toValue: 1.24,
            duration: 140,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(likeTranslateY, {
            toValue: -12,
            duration: 140,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]),
        Animated.spring(likeTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 14,
          speed: 14,
        }),
        Animated.timing(likeScale, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(likeScale, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(likeScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    }
  };

  const handleChatPress = () => {
    // Probeer verschillende velden voor owner ID
    const ownerId = item.owner?.id || item.userId || item.ownerId;
    
    if (!ownerId) {
      console.log('[VideoFeedItem] Geen owner ID beschikbaar voor chat. Item:', item);
      alert('Kan geen chat starten: eigenaar onbekend');
      return;
    }
    
    console.log('[VideoFeedItem] Open chat met owner ID:', ownerId);
    // Navigeer naar DM scherm met owner info
    router.push({
      pathname: '/dm',
      params: {
        userId: ownerId,
        userName: item.owner?.displayName || 'Video eigenaar',
      },
    });
  };

  const showPlaceholder = !videoSource || playerStatus === 'error';

  if (showPlaceholder) {
    // Determine message based on what data we have
    let message = 'Video wordt verwerkt…';
    let subMessage = 'Dit kan enkele minuten duren';
    
    if (playerStatus === 'error') {
      message = 'Video kan niet worden afgespeeld';
      subMessage = 'Probeer later opnieuw';
    } else if (!item.muxAssetId && !item.signedUrl) {
      message = 'Video wordt verwerkt door Mux';
      subMessage = 'Je video wordt geanalyseerd en geoptimaliseerd';
    } else if (item.muxAssetId && !item.signedUrl) {
      message = 'Video bijna klaar';
      subMessage = 'Afspeelbare versie wordt gegenereerd';
    }
    
    return (
      <View style={[styles.container, { height: boundedHeight, maxHeight: boundedHeight }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{message}</Text>
          <Text style={[styles.errorText, { fontSize: 14, marginTop: 8, opacity: 0.7 }]}>
            {subMessage}
          </Text>
          {item.title && (
            <Text style={[styles.errorText, { fontSize: 16, marginTop: 16, fontWeight: '600' }]}>
              {item.title}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: boundedHeight, maxHeight: boundedHeight }]}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
        onFirstFrameRender={() => setHasFirstFrame(true)}
      />

      {!hasFirstFrame && (
        <View style={styles.bufferOverlay} pointerEvents="none">
          <Text style={styles.bufferText}>Video laden…</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.topRightIcon}
        activeOpacity={0.8}
        onPress={handleHeartPress}
        accessibilityRole="button"
        accessibilityLabel={hearted ? 'Verwijder uit favorieten' : 'Markeer als favoriet'}
        accessibilityState={{ selected: hearted }}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          {hearted ? (
            <HeartTrueIconSvg width={56} height={56} accessible={false} />
          ) : (
            <HeartIconSvg width={56} height={56} accessible={false} />
          )}
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <View style={{ flex: 1, maxWidth: '65%' }}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{getRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{item.owner?.displayName || 'Onbekend'}</Text>
          <Text style={styles.subText} numberOfLines={2}>{item.title}</Text>
          {item.description && <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>}
          {item.category && <Text style={styles.categoryText} numberOfLines={1}>{item.category}</Text>}
        </View>
        <View style={styles.actionColumn}>
          <View style={styles.likeRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLikePress}
              style={styles.likeButton}
              accessibilityRole="button"
              accessibilityLabel={liked ? 'Vind ik leuk verwijderen' : 'Vind ik leuk'}
              accessibilityState={{ selected: liked }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: likeScale }, { translateY: likeTranslateY }],
                }}
              >
                {liked ? (
                  <LikedIconSvg width={56} height={56} accessible={false} />
                ) : (
                  <NonLikedIconSvg width={56} height={56} accessible={false} />
                )}
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.likeCount}>{likeCount}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.8}
            onPress={handleChatPress}
            accessibilityRole="button"
            accessibilityLabel="Chat openen"
          >
            <ChatIconHomepageSvg width={52} height={52} accessible={false} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bufferText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  topRightIcon: {
    position: 'absolute',
    top: 18,
    right: 16,
    zIndex: 10,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  timeBadge: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '700',
    marginBottom: 4,
  },
  subText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
  },
  descText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
  },
  categoryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
  },
  actionColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 0,
  },
  likeRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  likeButton: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeCount: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  chatButton: {
    marginTop: 10,
  },
});
