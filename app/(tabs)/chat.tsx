import HomeNavigationBar from '@/components/home-navigation-bar';
import { Link } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const ORANGE = '#FF8700';

const CHATS = [
  {
    id: '1',
    name: 'Maarten Kuip',
    message: 'Hallo, ik vond je pitch interessant....',
    time: '9:41',
    avatar: require('@/assets/images/homepage-maarten.png'),
  },
  {
    id: '2',
    name: 'Bram Wokke',
    message: 'Hi, hoe is het ermee? Ik ben opzoek naar iemand die....',
    time: '9:36',
    initials: 'BW',
  },
  {
    id: '3',
    name: 'Eliza van der Schelp',
    message: 'Hey, je pitch zag er goed uit en was benieuwd of je.....',
    time: '9:36',
    initials: 'ES',
  },
];

export default function ChatPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTitleWrapper}>
            <Text style={styles.headerTitle}>Chat</Text>
          </View>
          <View style={styles.headerLine} />
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {CHATS.map(chat => (
            <View key={chat.id}>
              {chat.id === '1' ? (
                <Link href="/chat" asChild>
                  <TouchableOpacity activeOpacity={0.85} style={styles.chatPressable}>
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
                        <Text style={styles.name}>{chat.name}</Text>
                        <Text style={styles.message} numberOfLines={1}>
                          {chat.message}
                        </Text>
                      </View>
                      <Text style={styles.time}>{chat.time}</Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ) : (
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
                    <Text style={styles.name}>{chat.name}</Text>
                    <Text style={styles.message} numberOfLines={1}>
                      {chat.message}
                    </Text>
                  </View>
                  <Text style={styles.time}>{chat.time}</Text>
                </View>
              )}
              <View style={styles.divider} />
            </View>
          ))}
        </ScrollView>
      </View>
      <HomeNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  headerTitleWrapper: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 6,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2233',
    letterSpacing: 0.1,
  },
  headerLine: {
    marginTop: 10,
    height: 4,
    backgroundColor: ORANGE,
    width: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
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
