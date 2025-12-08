import AppHeader from '@/components/app-header';
import { fetchAllMyMessages, getCurrentUserProfile, getUserById, type ChatMessage, type UserModel } from '@/hooks/useAuthApi';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadChats = useCallback(async () => {
    // De backend vereist een `with` query parameter om een gesprek op te halen,
    // er is geen endpoint voor een complete chatlijst. Laat daarom een vriendelijke uitleg zien.
    setLoading(false);
    setRefreshing(false);
    setChats([]);
    setError('Open een chat via een profiel of zoekresultaat. De API ondersteunt geen algemene chatlijst zonder `with` parameter.');
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleOpenDM = (chat: ChatListItem) => {
    router.push({
      pathname: '/dm',
      params: { userId: chat.id.toString(), userName: chat.name },
    });
  };

  const emptyState = useMemo(() => !loading && chats.length === 0, [loading, chats.length]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AppHeader title="Chat" />
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
              <Text style={styles.emptyText}>Begin een chat vanuit een profiel om hier gesprekken te zien.</Text>
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

const groupMessagesByUser = (messages: ChatMessage[], myId?: number) => {
  const grouped = new Map<number, ChatMessage[]>();
  const normalizeId = (value: unknown) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    return Number.isFinite(numeric as number) ? (numeric as number) : null;
  };

  messages.forEach((msg) => {
    const senderId = normalizeId(msg.sender_id);
    const receiverId = normalizeId(msg.receiver_id);
    const me = normalizeId(myId);
    const partnerId = me && senderId === me ? receiverId : senderId || receiverId;
    if (!partnerId) return;
    const list = grouped.get(partnerId) || [];
    list.push(msg);
    grouped.set(partnerId, list);
  });
  return grouped;
};

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
