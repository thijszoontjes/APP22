

import SettingsSvg from '@/assets/images/settings-svgrepo-com.svg';
import AppHeader from '@/components/app-header';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';

const tabLabels = ['Eigen video', 'Gelikte video', 'Favorieten'];

const FirstRoute = () => (
  <View style={styles.tabContentContainer}>
    <Text style={styles.tabContentText}>Tab: Eigen video</Text>
  </View>
);
const SecondRoute = () => (
  <View style={styles.tabContentContainer}>
    <Text style={styles.tabContentText}>Tab: Gelikte video</Text>
  </View>
);
const ThirdRoute = () => (
  <View style={styles.tabContentContainer}>
    <Text style={styles.tabContentText}>Tab: Favorieten</Text>
  </View>
);

const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
  third: ThirdRoute,
});

export default function ProfilePage() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: tabLabels[0] },
    { key: 'second', title: tabLabels[1] },
    { key: 'third', title: tabLabels[2] },
  ]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Profiel"
        actions={[
          <View key="settings" style={styles.optionCircle}>
            <SettingsSvg width={20} height={20} />
          </View>,
        ]}
      />
      <View style={styles.profilePicContainer}>
        <View style={styles.profilePicCircle} />
      </View>
      <View style={styles.profileInfoContainer}>
        <Text style={styles.profileName}>Anna Vermeer</Text>
        <Text style={styles.profileDetails}>+31 465436443</Text>
        <Text style={styles.profileDetails}>Anna01@gmail.com</Text>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: 360 }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#FF8700', height: 4 }}
            style={{ backgroundColor: '#fff' }}
            tabStyle={{ paddingVertical: 12 }}
            activeColor="#1A2233"
            inactiveColor="#5d5d5d"
            pressColor="#FF8700"
          />
        )}
      />
    </View>
  );
}

const ORANGE = '#FF8700';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  optionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 24,
    minHeight: 120,
  },
  profilePicCircle: {
    width: 154,
    aspectRatio: 1,
    borderRadius: 77,
    backgroundColor: '#FF8700', // bright orange for visibility
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2233',
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  profileDetails: {
    fontSize: 15,
    color: '#5d5d5d',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  tabBarContainer: {
    marginTop: 16,
    marginBottom: 16,
    position: 'relative',
  },
  tabBarRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabBarTab: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarText: {
    fontSize: 16,
    color: '#5d5d5d',
    fontWeight: '500',
  },
  tabBarTextActive: {
    color: '#1A2233',
    fontWeight: '700',
  },
  tabBarIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  tabContentText: {
    fontSize: 18,
    color: '#1A2233',
    fontWeight: '600',
  },
});
