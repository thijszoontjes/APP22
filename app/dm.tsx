import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SendIconSvg from '@/assets/images/send-icon.svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

type ChatMessage = {
  id: string;
  text: string;
  from: 'me' | 'them';
  createdAt: Date;
};

export default function DMChatPage() {
  const router = useRouter();
  const { userName = 'Chat', userId } = useLocalSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const dayLabel = useMemo(() => 'Vandaag', []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: `${Date.now()}`,
      text: trimmed,
      from: 'me',
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backWrap}>
            <ArrowBackSvg width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{userName}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
        {messages.length > 0 && (
          <View style={styles.dayChip}>
            <Text style={styles.dayChipText}>{dayLabel}</Text>
          </View>
        )}
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubbleRow, msg.from === 'me' ? styles.alignEnd : styles.alignStart]}>
            <View style={[styles.bubbleWrap, msg.from === 'me' ? styles.alignEnd : styles.alignStart]}>
              {msg.from === 'them' && <View style={styles.themTail} />}
              <View style={[styles.bubble, msg.from === 'me' ? styles.meBubble : styles.themBubble]}>
                <Text style={styles.bubbleText}>{msg.text}</Text>
                <Text style={styles.time}>{formatTime(msg.createdAt)}</Text>
              </View>
              {msg.from === 'me' && <View style={styles.meTail} />}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <View style={styles.plusCircle}>
          <Text style={styles.plusText}>+</Text>
        </View>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Bericht...."
          placeholderTextColor="#A0A0A0"
          multiline
        />
        <TouchableOpacity activeOpacity={0.85} onPress={handleSend} style={styles.sendButton}>
          <SendIconSvg width={18} height={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
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
    paddingTop: 44,
    paddingBottom: 0,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backWrap: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2233',
  },
  headerSpacer: {
    width: 24,
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
  dayChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 135, 0, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  dayChipText: {
    color: ORANGE,
    fontWeight: '600',
    fontSize: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  alignEnd: {
    justifyContent: 'flex-end',
  },
  alignStart: {
    justifyContent: 'flex-start',
  },
  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  meBubble: {
    backgroundColor: ORANGE,
    alignSelf: 'flex-end',
  },
  themBubble: {
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    fontSize: 15,
    color: '#1A2233',
  },
  time: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  meTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: ORANGE,
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    marginLeft: -2,
    marginBottom: -2,
  },
  themTail: {
    width: 0,
    height: 0,
    borderRightWidth: 10,
    borderRightColor: '#F5F5F5',
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    marginRight: -2,
    marginBottom: -2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  plusText: {
    fontSize: 20,
    color: ORANGE,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginRight: 8,
    color: '#1A2233',
  },
  sendButton: {
    padding: 8,
    backgroundColor: ORANGE,
    borderRadius: 16,
  },
});
