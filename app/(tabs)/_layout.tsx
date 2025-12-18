import { Tabs } from 'expo-router';
import React from 'react';

import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // Custom tab bar component
  const ORANGE = '#FF8700';
  const NAV_ITEMS = [
    { name: 'Home', route: 'index', icon: require('@/assets/images/home-icon.png') },
    { name: 'Chat', route: 'chat', icon: require('@/assets/images/chat-icon.png') },
    { name: 'Profiel', route: 'profile', icon: require('@/assets/images/profile-icon.png') },
  ];

  const CustomTabBar = ({ state, navigation }) => (
    <View 
      style={{
        backgroundColor: '#fff',
        borderRadius: 0,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom,
      }}
      pointerEvents="box-none"
    >
      <View style={{ height: 2, backgroundColor: ORANGE, width: '100%' }} />
      <View 
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingHorizontal: 32,
          paddingTop: 24,
          paddingBottom: 12,
          height: 90,
          gap: 48,
        }}
        pointerEvents="box-none"
      >
        {NAV_ITEMS.map((item) => {
          // Find the route key for this tab
          const routeIndex = state.routes.findIndex(r => r.name === item.route);
          const isActive = state.index === routeIndex;
          return (
            <TouchableOpacity 
              key={item.name}
              style={{ 
                alignItems: 'center', 
                flex: 1, 
                justifyContent: 'center', 
                flexDirection: 'column', 
                minHeight: 60,
                paddingVertical: 8,
              }}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(item.route);
                }
              }}
              activeOpacity={isActive ? 1 : 0.7}
              disabled={isActive}
            >
              {isActive ? (
                <>
                  <Text style={{ color: ORANGE, fontSize: 16, fontWeight: '500', marginTop: 2, marginBottom: 2, textAlign: 'center' }}>{item.name}</Text>
                  <View style={{ width: 32, height: 2, backgroundColor: ORANGE, borderRadius: 1, marginTop: 2, alignSelf: 'center' }} />
                </>
              ) : (
                <Image source={item.icon} style={{ width: 48, height: 48, marginBottom: 2, resizeMode: 'contain' }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
