import ChatIconHomepageSvg from '@/assets/images/chat-icon-homepage.svg';
import HeartIconSvg from '@/assets/images/heart-icon.svg';
import HeartTrueIconSvg from '@/assets/images/heart-true-icon.svg';
import LikedIconSvg from '@/assets/images/liked-icon.svg';
import NonLikedIconSvg from '@/assets/images/non-liked-icon.svg';
import type { FeedItem } from '@/hooks/useVideoApi';
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

interface VideoFeedItemProps {
  item: FeedItem;
  isActive: boolean;
  cardHeight?: number;
}

export default function VideoFeedItem({ item, isActive, cardHeight }: VideoFeedItemProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(item.liked);
  const [hearted, setHearted] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const heartScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const likeTranslateY = useRef(new Animated.Value(0)).current;

  // Gebruik signedUrl (van backend), anders HLS stream of progressive
  const videoSource = item.signedUrl || 
                      item.stream?.find((s) => s.protocol === 'hls')?.url || 
                      item.progressiveUrl || 
                      item.stream?.[0]?.url;

  console.log('[VideoFeedItem] Video item:', {
    id: item.id,
    title: item.title,
    hasSignedUrl: !!item.signedUrl,
    owner: item.owner,
    userId: item.userId,
    ownerId: item.ownerId,
    videoSource,
  });

  const player = useVideoPlayer(videoSource || '', (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (isActive && videoSource) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player, videoSource]);

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

  if (!videoSource) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Video niet beschikbaar</Text>
        </View>
      </View>
    );
  }

  const boundedHeight = cardHeight || SCREEN_HEIGHT;

  return (
    <View style={[styles.container, { height: boundedHeight, maxHeight: boundedHeight }]}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
      />

      <TouchableOpacity style={styles.topRightIcon} activeOpacity={0.8} onPress={handleHeartPress}>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          {hearted ? (
            <HeartTrueIconSvg width={56} height={56} />
          ) : (
            <HeartIconSvg width={56} height={56} />
          )}
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <View style={{ flex: 1, maxWidth: '65%' }}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>Nu beschikbaar</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{item.owner?.displayName || 'Onbekend'}</Text>
          <Text style={styles.subText} numberOfLines={2}>{item.title}</Text>
          {item.description && <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>}
          {item.category && <Text style={styles.categoryText} numberOfLines={1}>{item.category}</Text>}
        </View>
        <View style={styles.actionColumn}>
          <View style={styles.likeRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleLikePress} style={styles.likeButton}>
              <Animated.View
                style={{
                  transform: [{ scale: likeScale }, { translateY: likeTranslateY }],
                }}
              >
                {liked ? (
                  <LikedIconSvg width={56} height={56} />
                ) : (
                  <NonLikedIconSvg width={56} height={56} />
                )}
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.likeCount}>{likeCount}</Text>
          </View>
          <TouchableOpacity style={styles.chatButton} activeOpacity={0.8} onPress={handleChatPress}>
            <ChatIconHomepageSvg width={52} height={52} />
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
