import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

const HARD_CODED_RESULTS = [
  {
    id: 'maarten',
    name: 'Maarten Kuip',
    company: 'Design for All, Heerhugowaard',
    role: 'Webdesigner',
    avatar: require('@/assets/images/homepage-maarten.png'),
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<'personen' | 'community'>('personen');

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
        <View style={styles.fullDivider} />

        {results.map(result => (
          <View key={result.id} style={styles.listItemWrap}>
            <View style={styles.listItem}>
              <Image source={result.avatar} style={styles.avatar} />
              <View style={styles.listTextBlock}>
                <Text style={styles.listName}>{result.name}</Text>
                <Text style={styles.listCompany} numberOfLines={1}>
                  {result.company}
                </Text>
                <Text style={styles.listRole}>{result.role}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.9} style={styles.profileButton}>
                <Text style={styles.profileButtonText}>Open profiel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDEDED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
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
    color: '#1A2233',
    fontSize: 16,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#fff',
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
  fullDivider: {
    height: 2,
    backgroundColor: 'rgba(255,135,0,0.2)',
    marginVertical: 6,
    alignSelf: 'stretch',
    marginHorizontal: -24,
  },
  listItemWrap: {
    paddingHorizontal: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ORANGE,
  },
  listTextBlock: {
    flex: 1,
    gap: 2,
  },
  listName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  listCompany: {
    fontSize: 12.5,
    color: '#1A2233',
  },
  listRole: {
    fontSize: 12.5,
    color: '#1A2233',
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(255,135,0,0.2)',
    marginLeft: 74,
    marginRight: -20,
  },
});
