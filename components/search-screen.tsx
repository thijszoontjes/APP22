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
      
      // Specifieke error handling voor verschillende problemen
      const errorMsg = err?.message || 'Kon niet zoeken';
      
      if (errorMsg.includes('503') || errorMsg.includes('overbelast') || errorMsg.includes('niet beschikbaar')) {
        setError('⚠️ De server is tijdelijk overbelast. Probeer het over een paar minuten opnieuw.');
      } else if (errorMsg.includes('Sessie verlopen')) {
        setError('Je sessie is verlopen. Log opnieuw in.');
      } else if (errorMsg.includes('Network') || errorMsg.includes('verbinding')) {
        setError('Geen internetverbinding. Controleer je netwerk.');
      } else {
        setError(errorMsg);
      }
      
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePress = (user: UserModel) => {
    if (!user?.id) {
      alert('Kan profiel niet openen: geen gebruikers-ID');
      return;
    }
    
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || `Gebruiker ${user.id}`;
    
    // Navigeer naar DM scherm
    router.push({
      pathname: '/dm',
      params: {
        userId: String(user.id),
        userName: userName,
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
        <Text style={styles.infoText}>Zoek naar personen op naam, email, functie of sector en bekijk hun profiel of start een chat</Text>
        
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Zoek op naam of email..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <SearchIconSvg width={20} height={20} />
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
            {(error.includes('overbelast') || error.includes('503')) && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setError('');
                  performSearch();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Opnieuw proberen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && !error && results.length === 0 && query.trim().length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Zoek naar personen</Text>
            <Text style={styles.emptySubtext}>Begin met typen om te zoeken op naam, email, functie of sector</Text>
          </View>
        )}

        {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen gebruikers gevonden</Text>
            <Text style={styles.emptySubtext}>Probeer een andere zoekterm</Text>
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
                onPress={() => handleProfilePress(result)}
              >
                <Text style={styles.profileButtonText}>Chat starten</Text>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
    paddingHorizontal: 10,
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
  fullDivider: {
    height: 2,
    backgroundColor: 'rgba(255,135,0,0.2)',
    marginVertical: 6,
    alignSelf: 'stretch',
    marginHorizontal: -20,
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
    marginRight: -10,
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    color: '#1A2233',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: ORANGE,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#5c5c5c',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 6,
  },
});

