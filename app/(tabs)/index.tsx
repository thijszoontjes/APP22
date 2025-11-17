import BadgeSvg from '@/assets/images/badge.svg';
import ChatIconHomepageSvg from '@/assets/images/chat-icon-homepage.svg';
import HeartIconSvg from '@/assets/images/heart-icon.svg';
import LikedIconSvg from '@/assets/images/liked-icon.svg';
import NonLikedIconSvg from '@/assets/images/non-liked-icon.svg';
import HomeHeader from '@/components/home-header';
import HomeNavigationBar from '@/components/home-navigation-bar';
import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomePage() {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.container}>
      <HomeHeader />
      <View style={styles.content}>
        <ImageBackground
          source={require('@/assets/images/homepage-maarten.png')}
          style={styles.image}
          imageStyle={styles.imageStyle}
          resizeMode="cover">
          <TouchableOpacity style={styles.topRightIcon} activeOpacity={0.8}>
            <HeartIconSvg width={52} height={52} />
          </TouchableOpacity>
          <View style={styles.overlay}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>10 minuten geleden</Text>
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Johan Smith</Text>
              <BadgeSvg width={18} height={18} style={styles.badgeIcon} />
            </View>
            <Text style={styles.subText}>Strategist, Leiden</Text>
            <Text style={styles.subText}>Branding Consultant</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setLiked(l => !l)}>
                {liked ? <LikedIconSvg width={48} height={48} /> : <NonLikedIconSvg width={48} height={48} />}
              </TouchableOpacity>
              <Text style={styles.likeCount}>76</Text>
              <View style={styles.chatIconBox}>
                <ChatIconHomepageSvg width={34} height={34} />
              </View>
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
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 10,
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
    fontSize: 24,
    fontWeight: '700',
  },
  badgeIcon: {
    marginLeft: 6,
  },
  subText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-end',
  },
  likeCount: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
    marginRight: 20,
  },
  chatIconBox: {
    backgroundColor: ORANGE,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
});
