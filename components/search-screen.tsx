import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import BadgeSvg from '@/assets/images/badge.svg';
import ChatIconHomepageSvg from '@/assets/images/chat-icon-homepage.svg';
import HeartIconSvg from '@/assets/images/heart-icon.svg';
import HeartTrueIconSvg from '@/assets/images/heart-true-icon.svg';
import LikedIconSvg from '@/assets/images/liked-icon.svg';
import NonLikedIconSvg from '@/assets/images/non-liked-icon.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

const HARD_CODED_RESULTS = [
  {
    id: 'maarten',
    name: 'Maarten',
    subtitle: 'Marketing manager, Utrecht',
    time: '10 minuten geleden',
    image: require('@/assets/images/homepage-maarten.png'),
    nameFull: 'Maarten Kuip',
    subtitleLines: ['Strategist, Leiden', 'Branding Consultant'],
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<'personen' | 'community'>('personen');
  const [hearted, setHearted] = useState(false);
  const [liked, setLiked] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.2, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(heartScale, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start(() => setHearted(h => !h));
  };

  const results = useMemo(() => {
    if (query.trim().length === 0) return [];
    return HARD_CODED_RESULTS;
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconCircle} activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
            <ArrowBackSvg width={22} height={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Zoeken</Text>
          <View style={styles.iconPlaceholder} />
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <SearchIconSvg width={20} height={20} />
        </View>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.segment, segment === 'personen' && styles.segmentActive]}
            onPress={() => setSegment('personen')}>
            <Text style={[styles.segmentText, segment === 'personen' && styles.segmentTextActive]}>Personen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.segment, styles.segmentGhost, segment === 'community' && styles.segmentActiveGhost]}
            onPress={() => setSegment('community')}>
            <Text style={[styles.segmentTextGhost, segment === 'community' && styles.segmentTextActiveGhost]}>Community</Text>
          </TouchableOpacity>
        </View>

        {results.map(result => (
          <View key={result.id} style={styles.cardWrap}>
            <ImageBackground
              source={result.image}
              style={styles.cardImage}
              imageStyle={styles.cardImageStyle}
              resizeMode="cover">
              <View style={styles.cardTopRow}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{result.time}</Text>
                </View>
                <TouchableOpacity style={styles.topRightIcon} activeOpacity={0.85} onPress={handleHeartPress}>
                  <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    {hearted ? <HeartTrueIconSvg width={44} height={44} /> : <HeartIconSvg width={44} height={44} />}
                  </Animated.View>
                </TouchableOpacity>
              </View>
              <View style={styles.cardOverlay}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>{result.nameFull}</Text>
                    <BadgeSvg width={20} height={20} style={styles.badgeIcon} />
                  </View>
                  {result.subtitleLines.map(line => (
                    <Text key={line} style={styles.cardSubtitle}>{line}</Text>
                  ))}
                </View>
                <View style={styles.actionColumn}>
                  <View style={styles.likeRow}>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setLiked(l => !l)}>
                      {liked ? <LikedIconSvg width={48} height={48} /> : <NonLikedIconSvg width={48} height={48} />}
                    </TouchableOpacity>
                    <Text style={styles.likeCount}>76</Text>
                  </View>
                  <TouchableOpacity style={styles.chatButton} activeOpacity={0.85}>
                    <ChatIconHomepageSvg width={46} height={46} />
                  </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 44,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: '#F6F6F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#1A2233',
  },
  headerLine: {
    height: 4,
    backgroundColor: ORANGE,
    width: '100%',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8B8B8',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: '#fff',
    marginBottom: 14,
    width: '92%',
    alignSelf: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    width: '92%',
    alignSelf: 'center',
  },
  segment: {
    minWidth: 124,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentActive: {
    backgroundColor: ORANGE,
  },
  segmentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  segmentGhost: {
    borderWidth: 1,
    borderColor: '#1A2233',
    backgroundColor: '#fff',
  },
  segmentActiveGhost: {
    backgroundColor: '#1A2233',
  },
  segmentTextGhost: {
    color: '#1A2233',
    fontSize: 16,
    fontWeight: '700',
  },
  segmentTextActiveGhost: {
    color: '#fff',
  },
  cardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
  },
  cardImage: {
    width: '100%',
    height: 360,
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    width: '100%',
    height: '100%',
  },
  cardTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadge: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  topRightIcon: {
    padding: 4,
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeIcon: {
    marginLeft: 6,
  },
  cardName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  likeRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  likeCount: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  chatButton: {
    marginTop: 10,
  },
});
