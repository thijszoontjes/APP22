import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

const HARD_CODED_RESULTS = [
  {
    id: 'maarten',
    name: 'Maarten',
    subtitle: 'Marketing manager, Utrecht',
    time: '10 minuten geleden',
    image: require('@/assets/images/homepage-maarten.png'),
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

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
        <Text style={styles.label}>Zoek</Text>
        <View style={styles.searchBox}>
          <SearchIconSvg width={20} height={20} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Type om te zoeken"
            placeholderTextColor="#7a7a7a"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {results.map(result => (
          <TouchableOpacity key={result.id} style={styles.card} activeOpacity={0.9}>
            <Image source={result.image} style={styles.cardImage} resizeMode="cover" />
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{result.name}</Text>
              <Text style={styles.cardSubtitle}>{result.subtitle}</Text>
              <Text style={styles.cardTime}>{result.time}</Text>
            </View>
          </TouchableOpacity>
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
  label: {
    fontSize: 14,
    color: '#1A2233',
    marginLeft: 4,
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#fff',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cardImage: {
    width: 96,
    height: 96,
  },
  cardText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2233',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#1A2233',
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 13,
    color: '#7a7a7a',
  },
});
