import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ORANGE = '#FF8700';
const LIGHT_ORANGE = '#FCDCBE';
const SOFT_GRAY = '#E7E7E7';

type ChatMessage = {
  id: string;
  text: string;
  from: 'me' | 'them';
  createdAt: Date;
};

export default function DMChatPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const { userName = 'Maarten Kuip' } = useLocalSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const dayLabel = useMemo(() => {
    const first = messages[0]?.createdAt;
    return first ? getDayLabel(first) : '';
  }, [messages]);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
    scrollToBottom(false);
  }, [navigation]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const now = new Date();
    const msg: ChatMessage = {
      id: `${Date.now()}`,
      text: trimmed,
      from: 'me',
      createdAt: now,
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    scrollToBottom(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <ArrowBackSvg width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {userName}
        </Text>
      </View>
      <View style={styles.headerLine} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {dayLabel ? (
            <View style={styles.dayChip}>
              <Text style={styles.dayChipText}>{dayLabel}</Text>
            </View>
          ) : null}
          {messages.map((message) => {
            const isMe = message.from === 'me';
            return (
              <View key={message.id} style={isMe ? styles.bubbleRowRight : styles.bubbleRowLeft}>
                <View style={isMe ? styles.bubbleRight : styles.bubbleLeft}>
                  <Text style={isMe ? styles.bubbleTextRight : styles.bubbleTextLeft}>{message.text}</Text>
                  <Text style={isMe ? styles.bubbleTimeRight : styles.bubbleTimeLeft}>{formatTime(message.createdAt)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <View style={styles.plusCircle}>
              <Text style={styles.plusIcon}>{'+'}</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Bericht...."
              placeholderTextColor="#B4B4B4"
              multiline
            />
            <TouchableOpacity activeOpacity={0.85} style={styles.sendButton} onPress={handleSend}>
              <Image source={require('@/assets/images/send-icon.png')} style={styles.sendIconLarge} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function getDayLabel(date: Date) {
  const now = new Date();
  const today = isSameDay(now, date);
  if (today) return 'Vandaag';
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#202020',
    fontWeight: '600',
    marginRight: 44,
  },
  headerLine: {
    height: 2,
    backgroundColor: ORANGE,
  },
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 12,
    paddingTop: 12,
  },
  dayChip: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT_ORANGE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    marginLeft: 16,
  },
  dayChipText: {
    color: '#C17B2C',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  bubbleRowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bubbleRight: {
    maxWidth: '78%',
    backgroundColor: LIGHT_ORANGE,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleTextRight: {
    fontSize: 15,
    color: '#1A2233',
    fontWeight: '400',
    marginBottom: 4,
  },
  bubbleTimeRight: {
    fontSize: 12,
    color: '#00000080',
    alignSelf: 'flex-end',
  },
  bubbleRowLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bubbleLeft: {
    maxWidth: '78%',
    backgroundColor: SOFT_GRAY,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleTextLeft: {
    fontSize: 15,
    color: '#1A2233',
    fontWeight: '400',
    marginBottom: 4,
  },
  bubbleTimeLeft: {
    fontSize: 12,
    color: '#00000080',
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9E9E9',
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  plusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B4B4B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 20,
    color: '#B4B4B4',
    marginTop: -1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    color: '#1A2233',
    marginHorizontal: 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    marginLeft: 6,
  },
  sendIconLarge: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
});
