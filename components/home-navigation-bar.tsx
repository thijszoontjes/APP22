import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NAV_ITEMS = [
  { name: 'Home', route: '/(tabs)', icon: require('@/assets/images/home-icon.png') },
  { name: 'Chat', route: '/(tabs)/chat', icon: require('@/assets/images/chat-icon.png') },
  { name: 'Profiel', route: '/(tabs)/profile', icon: require('@/assets/images/profile-icon.png') },
];

export default function HomeNavigationBar() {
  const router = useRouter();
  const segments = useSegments();
  // Determine active tab by route segment
  let activeIndex = 0;
  if (segments[1] === 'chat') activeIndex = 1;
  if (segments[1] === 'profile') activeIndex = 2;

  return (
    <View style={styles.navBar}>
      {NAV_ITEMS.map((item, idx) => (
        <View style={styles.navItem} key={item.name}>
          {activeIndex === idx ? (
            <>
              <Text style={styles.activeLabel}>{item.name}</Text>
              <View style={styles.underline} />
            </>
          ) : (
            <TouchableOpacity onPress={() => router.replace(item.route)}>
              <Image source={item.icon} style={styles.icon} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const ORANGE = '#FF8700';

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 12,
    height: 90,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 48,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
    minHeight: 60,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 2,
    resizeMode: 'contain',
  },
  activeLabel: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
  underline: {
    width: 32,
    height: 2,
    backgroundColor: ORANGE,
    borderRadius: 1,
    marginTop: 2,
    alignSelf: 'center',
  },
});
