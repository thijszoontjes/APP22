import HomeHeader from '@/components/home-header';
import HomeNavigationBar from '@/components/home-navigation-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function HomePage() {
  return (
    <View style={styles.container}>
      <HomeHeader />
      {/* Content kan hier komen */}
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
});
