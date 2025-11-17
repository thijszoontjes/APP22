import HomeNavigationBar from '@/components/home-navigation-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ChatPage() {
  return (
    <View style={styles.container}>
      <HomeNavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-end',
  },
});
