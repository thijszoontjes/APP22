import AppHeader from '@/components/app-header';
import { ensureValidSession, fetchConversation, getUserById } from '@/hooks/useAuthApi';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ORANGE = '#FF8700';

type ChatListItem = {
  id: number;
  name: string;
  message: string;
  time: string;
  lastAt: number;
  avatar?: ImageSourcePropType;
  initials?: string;
};

type StoredChatRef = {
  userId: number;
  name?: string;
};

const LAST_CHATS_KEY = 'last_chats_v1';

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const readStoredChats = useCallback(async (): Promise<StoredChatRef[]> => {
    try {
      const raw = await SecureStore.getItemAsync(LAST_CHATS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item: any) => ({
          userId: Number(item?.userId),
          name: typeof item?.name === 'string' ? item.name : undefined,
        }))
        .filter((item: StoredChatRef) => Number.isFinite(item.userId) && item.userId > 0);
    } catch {
      return [];
    }
  }, []);

  const upsertStoredChat = useCallback(async (contact: StoredChatRef) => {
    if (!Number.isFinite(contact.userId) || contact.userId <= 0) {
      return;
    }
    const current = await readStoredChats();
    const filtered = current.filter(c => c.userId !== contact.userId);
    const next = [{ userId: contact.userId, name: contact.name }, ...filtered].slice(0, 10);
    try {
      await SecureStore.setItemAsync(LAST_CHATS_KEY, JSON.stringify(next));
    } catch {
      // best-effort
    }
  }, [readStoredChats]);

  const fetchPreview = useCallback(async (contact: StoredChatRef): Promise<ChatListItem | null> => {
    if (!Number.isFinite(contact.userId) || contact.userId <= 0) {
      return null;
    }
    try {
      const [user, messages] = await Promise.allSettled([
        getUserById(contact.userId),
        fetchConversation(contact.userId),
      ]);

      let name = contact.name || `Gebruiker #${contact.userId}`;
      if (user.status === 'fulfilled') {
        const maybeName = [user.value.first_name, user.value.last_name].filter(Boolean).join(' ').trim();
        if (maybeName) name = maybeName;
      }

      const list = messages.status === 'fulfilled' && Array.isArray(messages.value) ? messages.value : [];
      const sorted = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const last = sorted[sorted.length - 1];

      return {
        id: contact.userId,
        name,
        message: last?.content || 'Nog geen berichten',
        time: formatTimeLabel(last?.created_at),
        lastAt: last ? new Date(last.created_at).getTime() : 0,
        initials: deriveInitials(name),
      };
    } catch {
      return {
        id: contact.userId,
        name: contact.name || `Gebruiker #${contact.userId}`,
        message: 'Nog geen berichten',
        time: '',
        lastAt: 0,
        initials: deriveInitials(contact.name || `Gebruiker #${contact.userId}`),
      };
    }
  }, []);

  const loadChats = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      // Valideer sessie eerst
      const isValid = await ensureValidSession();
      if (!isValid) {
        setError('Sessie verlopen. Log opnieuw in.');
        setLoading(false);
        setRefreshing(false);
        router.replace('/login');
        return;
      }

      const saved = await readStoredChats();
      if (!saved.length) {
        setChats([]);
        setError('We hebben nog geen video-feed; gebruik het ID-veld bovenaan om een chat te starten.');
      } else {
        const previews = await Promise.all(saved.map(fetchPreview));
        const filtered = previews.filter(Boolean) as ChatListItem[];
        filtered.sort((a, b) => b.lastAt - a.lastAt);
        setChats(filtered);
      }
    } catch (err: any) {
      setError(err?.message || 'Kon chats niet laden.');
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [readStoredChats, fetchPreview]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleOpenDM = (chat: ChatListItem) => {
    router.push({
      pathname: '/dm',
      params: { userId: chat.id.toString(), userName: chat.name },
    });
  };

  const handleStartManual = async () => {
    const idNum = Math.trunc(Number(manualId));
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setError('Vul een geldig gebruikers-ID in.');
      return;
    }
    await upsertStoredChat({ userId: idNum });
    setError('');
    await loadChats();
    router.push({
      pathname: '/dm',
      params: { userId: idNum.toString(), userName: `Gebruiker #${idNum}` },
    });
  };

  const emptyState = useMemo(() => !loading && chats.length === 0, [loading, chats.length]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AppHeader title="Chat" />
        <View style={styles.manualBar}>
          <View style={styles.manualInputs}>
            <TextInput
              style={styles.manualIdInput}
              value={manualId}
              onChangeText={setManualId}
              placeholder="Gebruikers-ID"
              placeholderTextColor="#8a8a8a"
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.manualButton} onPress={handleStartManual} activeOpacity={0.85}>
            <Text style={styles.manualButtonText}>Open chat</Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>Geen video-feed beschikbaar; gebruik tijdelijk het ID van een gebruiker om een chat te starten.</Text>
        </View>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadChats(); }} />}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadChats}>
                <Text style={styles.retryText}>Opnieuw laden</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {emptyState ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nog geen gesprekken</Text>
              <Text style={styles.emptyText}>Start een chat met het ID-veld bovenaan om gesprekken te openen.</Text>
            </View>
          ) : null}
          {chats.map(chat => (
            <View key={chat.id}>
              <View style={styles.chatRow}>
                <View style={styles.avatarRing}>
                  {chat.avatar ? (
                    <Image source={chat.avatar} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitials}>{chat.initials}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.textBlock}>
                  <TouchableOpacity onPress={() => handleOpenDM(chat)} activeOpacity={0.7}>
                    <Text style={styles.name}>{chat.name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.message} numberOfLines={1}>
                    {chat.message || 'Geen berichten'}
                  </Text>
                </View>
                <Text style={styles.time}>{chat.time}</Text>
              </View>
              <View style={styles.divider} />
            </View>
          ))}
        </ScrollView>
      </View>
      {/* Removed custom navigation bar */}
    </View>
  );
}

const deriveInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '';
  const [first, second] = parts;
  return `${first?.[0] || ''}${second?.[0] || ''}`.toUpperCase();
};

const formatTimeLabel = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  errorWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#c1121f',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ORANGE,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  manualBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  manualInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  manualIdInput: {
    flex: 0.6,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A2233',
  },
  manualButton: {
    alignSelf: 'flex-start',
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  manualButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  infoText: {
    color: '#5c5c5c',
    fontSize: 12,
    paddingHorizontal: 2,
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2233',
  },
  emptyText: {
    fontSize: 14,
    color: '#5c5c5c',
    textAlign: 'center',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  chatPressable: {
    flex: 1,
  },
  avatarRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2,
    borderWidth: 2,
    borderColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2233',
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2233',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1A2233',
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2233',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 135, 0, 0.2)',
    marginLeft: 94,
    marginRight: 0,
  },
});
