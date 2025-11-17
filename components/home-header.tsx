import FilterIconSvg from '@/assets/images/filter-icon.svg';
import SearchIconSvg from '@/assets/images/search-icon.svg';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeHeader() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <SearchIconSvg width={28} height={28} />
        </View>
        <Text style={styles.title}>Ontdek het netwerk</Text>
        <View style={styles.iconCircle}>
          <FilterIconSvg width={28} height={28} />
        </View>
      </View>
      <View style={styles.orangeLine} />
    </View>
  );
}

const ORANGE = '#FF8700';

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 44, // ruimte voor notch/statusbar
    paddingBottom: 0,
    paddingHorizontal: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#1A2233',
    letterSpacing: 0.1,
  },
  orangeLine: {
    height: 4,
    backgroundColor: ORANGE,
    width: '100%',
    marginTop: 0,
  },
});
