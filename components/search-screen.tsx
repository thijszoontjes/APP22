import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import AppHeader from '@/components/app-header';
import { searchUsers, type UserModel } from '@/hooks/useAuthApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<'personen' | 'community'>('personen');
  const [results, setResults] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length === 0) {
        setResults([]);
        setError('');
        return;
      }

      if (query.trim().length < 2) {
        setResults([]);
        setError('');
        return;
      }

      performSearch();
    }, 500); // Debounce: wacht 500ms na laatste typing

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const users = await searchUsers(query);
      setResults(users);
      
      if (users.length === 0 && query.trim().length >= 2) {
        setError('Geen gebruikers gevonden');
      }
    } catch (err: any) {
      console.error('[SearchScreen] Zoeken mislukt:', err);
      setError(err?.message || 'Kon niet zoeken');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePress = (userId?: number) => {
    if (!userId) {
      alert('Kan profiel niet openen');
      return;
    }
    // Navigeer naar profiel of DM scherm
    router.push({
      pathname: '/dm',
      params: {
        userId: userId,
        userName: `Gebruiker ${userId}`,
      },
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Zoeken"
        backgroundColor="#F6F6F6"
        leading={
          <TouchableOpacity style={styles.iconCircle} activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
            <ArrowBackSvg width={22} height={22} />
          </TouchableOpacity>
        }
      />

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

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ORANGE} />
            <Text style={styles.loadingText}>Zoeken...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        )}

        {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen gebruikers gevonden</Text>
          </View>
        )}

        {!loading && results.map(result => (
          <View key={result.id} style={styles.listItemWrap}>
            <View style={styles.listItem}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {(result.first_name?.[0] || '').toUpperCase()}{(result.last_name?.[0] || '').toUpperCase()}
                </Text>
              </View>
              <View style={styles.listTextBlock}>
                <Text style={styles.listName}>
                  {result.first_name} {result.last_name}
                </Text>
                {result.job_function && (
                  <Text style={styles.listRole}>{result.job_function}</Text>
                )}
                {result.sector && (
                  <Text style={styles.listCompany} numberOfLines={1}>
                    {result.sector}
                  </Text>
                )}
                {result.country && (
                  <Text style={styles.listCompany} numberOfLines={1}>
                    {result.country}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.profileButton}
                onPress={() => handleProfilePress(result.id)}
              >
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
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ORANGE,
    backgroundColor: '#FFE8D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: ORANGE,
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

