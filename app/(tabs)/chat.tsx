import AppHeader from '@/components/app-header';
import { ensureValidSession, fetchConversations, getUserById } from '@/hooks/useAuthApi';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

type ChatListItem = {
  email: string;
  userId?: string;
  id: string;
  name: string;
  message: string;
  time: string;
  lastAt: number;
  avatar?: ImageSourcePropType;
  initials?: string;
};

type StoredChatRef = {
  email: string;
  userId?: string;
  name?: string;
};

const LAST_CHATS_KEY = 'last_chats_v1';

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [manualEmail, setManualEmail] = useState('');
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
        .map((item: any) => {
          const rawEmail =
            typeof item?.email === 'string' ? item.email :
            typeof item?.userEmail === 'string' ? item.userEmail :
            (typeof item?.userId === 'string' && item.userId.includes('@') ? item.userId : '');
          const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
          if (!email || !email.includes('@')) {
            if (item?.userId) {
              console.log('[ChatPage] Sla opgeslagen contact zonder e-mail over:', item?.userId);
            }
            return null;
          }
          const userId = typeof item?.userId === 'string' && !item.userId.includes('@') ? item.userId.trim() : undefined;
          return {
            email,
            userId,
            name: typeof item?.name === 'string' ? item.name : undefined,
          };
        })
        .filter((item: StoredChatRef | null): item is StoredChatRef => Boolean(item?.email));
    } catch {
      return [];
    }
  }, []);

  const upsertStoredChat = useCallback(async (contact: StoredChatRef) => {
    const normalizedEmail = contact.email.trim();
    if (!normalizedEmail) {
      return;
    }
    const current = await readStoredChats();
    const filtered = current.filter(c => c.email !== normalizedEmail);
    const next = [{ email: normalizedEmail, userId: contact.userId, name: contact.name }, ...filtered].slice(0, 10);
    try {
      await SecureStore.setItemAsync(LAST_CHATS_KEY, JSON.stringify(next));
    } catch {
      // best-effort
    }
  }, [readStoredChats]);

  const fetchPreview = useCallback(async (contact: StoredChatRef): Promise<ChatListItem | null> => {
    const email = contact.email.trim();
    const userId = contact.userId?.trim();
    if (!email) {
      return null;
    }
    try {
      const [user, messages] = await Promise.allSettled([
        userId ? getUserById(userId) : Promise.resolve(null as any),
        fetchConversation(email),
      ]);

      let name = contact.name || '';
      if (user.status === 'fulfilled' && user.value) {
        const maybeName = [user.value.first_name, user.value.last_name].filter(Boolean).join(' ').trim();
        if (maybeName) name = maybeName;
      }
      if (!name) {
        name = email;
      }

      const list = messages.status === 'fulfilled' && Array.isArray(messages.value) ? messages.value : [];
      const sorted = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const last = sorted[sorted.length - 1];

      // Skip chats without any messages (placeholder data)
      if (!last) {
        return null;
      }

      return {
        id: email,
        email,
        userId,
        name,
        message: last?.content || 'Nog geen berichten',
        time: formatTimeLabel(last?.created_at),
        lastAt: last ? new Date(last.created_at).getTime() : 0,
        initials: deriveInitials(name),
      };
    } catch {
      // Skip chats that fail to load (likely placeholder data)
      return null;
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

      // Fetch conversations from backend
      const conversations = await fetchConversations();
      
      if (!conversations || conversations.length === 0) {
        setChats([]);
        setError('Nog geen gesprekken. Gebruik het e-mailadresveld bovenaan om een chat te starten.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Map backend conversations to UI format
      const chatItems: ChatListItem[] = await Promise.all(
        conversations.map(async (conv) => {
          const email = conv.with_email;
          let name = email;
          let userId: string | undefined;

          // Try to fetch user details to get name
          try {
            // We don't have userId here, so we'll need to keep email as name for now
            // or enhance the backend to return more user details
            name = email;
          } catch {
            name = email;
          }

          return {
            id: email,
            email,
            userId,
            name,
            message: conv.last_message || 'Nog geen berichten',
            time: formatTimeLabel(conv.last_at),
            lastAt: new Date(conv.last_at).getTime(),
            initials: deriveInitials(name),
          };
        })
      );

      // Sort by most recent
      chatItems.sort((a, b) => b.lastAt - a.lastAt);
      setChats(chatItems);

      // Update stored chats for offline access
      const storedChats = chatItems.map(chat => ({
        email: chat.email,
        userId: chat.userId,
        name: chat.name,
      }));
      try {
        await SecureStore.setItemAsync(LAST_CHATS_KEY, JSON.stringify(storedChats));
      } catch {
        // best-effort storage
      }
    } catch (err: any) {
      console.error('[ChatPage] Load chats error:', err);
      setError(err?.message || 'Kon chats niet laden.');
      
      // Fallback to stored chats if available
      try {
        const saved = await readStoredChats();
        if (saved.length > 0) {
          const placeholders: ChatListItem[] = saved.map(contact => {
            const name = contact.name || contact.email;
            return {
              id: contact.email,
              email: contact.email,
              userId: contact.userId,
              name,
              message: 'Offline - kon niet verversen',
              time: '',
              lastAt: 0,
              initials: deriveInitials(name),
            };
          });
          setChats(placeholders);
          setError('Offline modus - toon opgeslagen contacten');
        }
      } catch {
        setChats([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [readStoredChats]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleOpenDM = (chat: ChatListItem) => {
    router.push({
      pathname: '/dm',
      params: { userEmail: chat.email, userId: chat.userId, userName: chat.name },
    });
  };

  const handleStartManual = async () => {
    const normalizedEmail = manualEmail.trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Vul een geldig e-mailadres in.');
      return;
    }
    await upsertStoredChat({ email: normalizedEmail });
    setError('');
    await loadChats();
    router.push({
      pathname: '/dm',
      params: { userEmail: normalizedEmail, userName: normalizedEmail },
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
              value={manualEmail}
              onChangeText={setManualEmail}
              placeholder="E-mailadres ontvanger"
              placeholderTextColor="#8a8a8a"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity style={styles.manualButton} onPress={handleStartManual} activeOpacity={0.85}>
            <Text style={styles.manualButtonText}>Open chat</Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>Gebruik het e-mailadres van de ontvanger om een chat te starten.</Text>
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
              <Text style={styles.emptyText}>Start een chat met het e-mailadresveld bovenaan om gesprekken te openen.</Text>
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
