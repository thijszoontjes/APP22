import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SendIconSvg from '@/assets/images/send-icon.svg';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

type ChatMessage = {
  id: string;
  text: string;
  from: 'me' | 'them';
  createdAt: Date;
};

export default function ChatDetail() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const dayLabel = useMemo(() => 'Vandaag', []);

  // Get userName from navigation params
  const userName = router?.params?.userName || 'Chat';

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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2233',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  headerLine: {
    height: 4,
    backgroundColor: ORANGE,
    width: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 8,
  },
  dayChip: {
    alignSelf: 'center',
    backgroundColor: '#f5b56b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 6,
  },
  dayChipText: {
    color: '#1A2233',
    fontSize: 13,
    fontWeight: '600',
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  alignEnd: {
    justifyContent: 'flex-end',
  },
  alignStart: {
    justifyContent: 'flex-start',
  },
  bubbleWrap: {
    maxWidth: '78%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  bubble: {
    flexShrink: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  meBubble: {
    backgroundColor: '#f7c690',
    borderTopRightRadius: 6,
  },
  themBubble: {
    backgroundColor: '#e2e2e2',
    borderTopLeftRadius: 6,
  },
  meTail: {
    width: 12,
    height: 12,
    backgroundColor: '#f7c690',
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
    marginBottom: 10,
    borderBottomLeftRadius: 12,
  },
  themTail: {
    width: 12,
    height: 12,
    backgroundColor: '#e2e2e2',
    transform: [{ rotate: '45deg' }],
    marginRight: 4,
    marginBottom: 10,
    borderBottomRightRadius: 12,
  },
  bubbleText: {
    fontSize: 15,
    color: '#1A2233',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#5d5d5d',
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cfcfcf',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    gap: 8,
  },
  plusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#a0a0a0',
    fontSize: 18,
    fontWeight: '300',
    marginTop: -1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    maxHeight: 96,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
