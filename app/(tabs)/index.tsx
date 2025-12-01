import BadgeSvg from '@/assets/images/badge.svg';
import ChatIconHomepageSvg from '@/assets/images/chat-icon-homepage.svg';
import FilterIconSvg from '@/assets/images/filter-icon.svg';
import HeartIconSvg from '@/assets/images/heart-icon.svg';
import HeartTrueIconSvg from '@/assets/images/heart-true-icon.svg';
import LikedIconSvg from '@/assets/images/liked-icon.svg';
import NonLikedIconSvg from '@/assets/images/non-liked-icon.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import AppHeader from '@/components/app-header';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { clearAuthToken, getHomeHintSeen, setHomeHintSeen } from '@/hooks/authStorage';

export default function HomePage() {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [hearted, setHearted] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const likeTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadHintState = async () => {
      const seen = await getHomeHintSeen();
      setShowScrollHint(!seen);
    };
    loadHintState();
  }, []);

  const handleHeartPress = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.2, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(heartScale, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start(() => setHearted(h => !h));
  };

  const handleLikePress = () => {
    const willLike = !liked;
    setLiked(willLike);

    if (willLike) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(likeScale, { toValue: 1.24, duration: 140, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.timing(likeTranslateY, { toValue: -12, duration: 140, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]),
        Animated.spring(likeTranslateY, { toValue: 0, useNativeDriver: true, bounciness: 14, speed: 14 }),
        Animated.timing(likeScale, { toValue: 1, duration: 160, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(likeScale, { toValue: 0.9, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(likeScale, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]).start();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Ontdek het netwerk"
        leading={
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={() => router.push('/search')}>
            <SearchIconSvg width={26} height={26} />
          </TouchableOpacity>
        }
        actions={[
          <TouchableOpacity key="filter" style={styles.headerIcon} activeOpacity={0.85} onPress={() => router.push('/filters')}>
            <FilterIconSvg width={26} height={26} />
          </TouchableOpacity>,
        ]}
      />
      <View style={styles.content}>
        <ImageBackground
          source={require('@/assets/images/homepage-maarten.png')}
          style={styles.image}
          imageStyle={styles.imageStyle}
          resizeMode="cover">
          <TouchableOpacity style={styles.logoutTest} activeOpacity={0.85} onPress={async () => { await clearAuthToken(); router.replace('/login'); }}>
            <Text style={styles.logoutText}>Log uit (test)</Text>
          </TouchableOpacity>
          {showScrollHint && (
            <TouchableOpacity style={styles.hintOverlay} activeOpacity={0.85} onPress={() => { setShowScrollHint(false); setHomeHintSeen(); }}>
              <View style={styles.hintContent}>
                <Text style={styles.hintText}>scrol verticaal om nieuwe videos te ontdekken.</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.topRightIcon} activeOpacity={0.8} onPress={handleHeartPress}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              {hearted ? <HeartTrueIconSvg width={56} height={56} /> : <HeartIconSvg width={56} height={56} />}
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.overlay}>
            <View style={{flex: 1}}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>10 minuten geleden</Text>
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.name}>Johan Smith</Text>
                <BadgeSvg width={22} height={22} style={styles.badgeIcon} />
              </View>
              <Text style={styles.subText}>Strategist, Leiden</Text>
              <Text style={styles.subText}>Branding Consultant</Text>
            </View>
            <View style={styles.actionColumn}>
              <View style={styles.likeRow}>
                <TouchableOpacity activeOpacity={0.8} onPress={handleLikePress} style={styles.likeButton}>
                  <Animated.View style={{ transform: [{ scale: likeScale }, { translateY: likeTranslateY }] }}>
                    {liked ? <LikedIconSvg width={56} height={56} /> : <NonLikedIconSvg width={56} height={56} />}
                  </Animated.View>
                </TouchableOpacity>
                <Text style={styles.likeCount}>76</Text>
              </View>
              <TouchableOpacity style={styles.chatButton} activeOpacity={0.8}>
                <ChatIconHomepageSvg width={52} height={52} />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
      {/* Removed custom navigation bar */}
    </View>
  );
}

const ORANGE = '#FF8700';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    overflow: 'hidden', // voorkom verticale scroll/bounce
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
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  topRightIcon: {
    position: 'absolute',
    top: 18,
    right: 16,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '700',
  },
  badgeIcon: {
    marginLeft: 6,
  },
  subText: {
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
  logoutTest: {
    position: 'absolute',
    top: 24,
    left: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  hintContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  hintText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
});
