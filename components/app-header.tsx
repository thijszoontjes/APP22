import React, { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  actions?: ReactNode[];
  backgroundColor?: string;
};

const ORANGE = '#FF8700';
const TYPOGRAPHY = {
  family: Platform.select({ ios: 'System', default: 'System' }),
  titleSize: 18,
  subtitleSize: 14,
  weightSemibold: '600' as const,
  weightMedium: '500' as const,
};

export function AppHeader({
  title,
  subtitle,
  leading,
  actions = [],
  backgroundColor = '#fff',
}: AppHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.contentRow}>
        <View style={styles.sideSlot}>{leading ?? <View style={styles.spacer} />}</View>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actionsRow}>
          {actions.length
            ? actions.map((action, idx) => (
                <View key={idx} style={styles.actionItem}>
                  {action}
                </View>
              ))
            : <View style={styles.spacer} />}
        </View>
      </View>
      <View style={styles.orangeLine} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  sideSlot: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionsRow: {
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionItem: {
    minWidth: 42,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 42,
    height: 42,
  },
  textBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: TYPOGRAPHY.family,
    fontSize: TYPOGRAPHY.titleSize,
    fontWeight: TYPOGRAPHY.weightSemibold,
    color: '#1A2233',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.family,
    fontSize: TYPOGRAPHY.subtitleSize,
    fontWeight: TYPOGRAPHY.weightMedium,
    color: '#4A5567',
    marginTop: 2,
    textAlign: 'center',
  },
  orangeLine: {
    height: 2,
    backgroundColor: ORANGE,
    width: '100%',
  },
});

export default AppHeader;
