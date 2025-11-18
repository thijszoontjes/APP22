import BadgeSvg from '@/assets/images/badge.svg';
import ChatIconHomepageSvg from '@/assets/images/chat-icon-homepage.svg';
import HeartIconSvg from '@/assets/images/heart-icon.svg';
import HeartTrueIconSvg from '@/assets/images/heart-true-icon.svg';
import LikedIconSvg from '@/assets/images/liked-icon.svg';
import NonLikedIconSvg from '@/assets/images/non-liked-icon.svg';
import HomeHeader from '@/components/home-header';
import HomeNavigationBar from '@/components/home-navigation-bar';
import React, { useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomePage() {
  const [liked, setLiked] = useState(false);
  const [hearted, setHearted] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.2, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(heartScale, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start(() => setHearted(h => !h));
  };

  return (
    <View style={styles.container}>
      <HomeHeader />
      <View style={styles.content}>
        <ImageBackground
          source={require('@/assets/images/homepage-maarten.png')}
          style={styles.image}
          imageStyle={styles.imageStyle}
          resizeMode="cover">
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
                <TouchableOpacity activeOpacity={0.8} onPress={() => setLiked(l => !l)}>
                  {liked ? <LikedIconSvg width={56} height={56} /> : <NonLikedIconSvg width={56} height={56} />}
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
      <HomeNavigationBar />
    </View>
  );
}

const ORANGE = '#FF8700';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
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
