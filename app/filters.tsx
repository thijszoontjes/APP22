import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SaveIconSvg from '@/assets/images/save-icon.svg';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeTouchEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

const CATEGORIES = ['Technologie', 'Zorg', 'Social media', 'Marketing', 'Educatie', 'Design', 'Coding'];

export default function FiltersPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(120);
  const trackWidthRef = useRef(280); // start with a reasonable width for initial layout

  const SLIDER_MIN = 0;
  const SLIDER_MAX = 120;

  useEffect(() => {
    navigation?.setOptions?.({ gestureEnabled: false });
  }, [navigation]);

  const ratio = useMemo(() => {
    const r = (sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
    return Math.max(0, Math.min(1, r));
  }, [sliderValue]);

  const trackWidth = trackWidthRef.current || 1;
  const thumbTranslate = Math.min(Math.max(ratio * trackWidth - 12, -12), trackWidth - 12);

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  const updateValueFromX = (x: number) => {
    const width = Math.max(trackWidthRef.current, 1);
    const clampedX = Math.max(0, Math.min(width, x));
    const newValue = SLIDER_MIN + (clampedX / width) * (SLIDER_MAX - SLIDER_MIN);
    setSliderValue(prev => {
      const next = Math.round(newValue);
      return next === prev ? prev : next;
    });
  };

  const handleResponder = (e: { nativeEvent: NativeTouchEvent }) => {
    updateValueFromX(e.nativeEvent.locationX);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backCircle} activeOpacity={0.8} onPress={() => router.replace('/(tabs)')}>
            <ArrowBackSvg width={22} height={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters aanpassen</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionSpacing} />
        <View style={styles.sliderBlock}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Maximumafstand die getoond wordt</Text>
            <Text style={styles.sliderValue}>{sliderValue}km</Text>
          </View>
          <View
            style={styles.sliderTrack}
            onLayout={handleTrackLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={handleResponder}
            onResponderMove={handleResponder}>
            <View style={[styles.sliderProgress, { width: `${ratio * 100}%` }]} />
            <View style={[styles.sliderThumb, { transform: [{ translateX: thumbTranslate }] }]} />
          </View>
        </View>

        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>Filter op categorie</Text>
          <View style={styles.pillWrap}>
            {CATEGORIES.map(cat => {
              const active = selectedCategories.includes(cat);
              const toggle = () =>
                setSelectedCategories(prev =>
                  prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
                );
              return (
                <TouchableOpacity key={cat} activeOpacity={0.85} onPress={toggle} style={[styles.pill, active && styles.pillActive]}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity activeOpacity={0.85} style={styles.saveButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.saveButtonText}>Opslaan</Text>
            <SaveIconSvg width={18} height={18} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Removed custom navigation bar */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 44,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: '#F6F6F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '500',
    color: '#1A2233',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  headerLine: {
    height: 4,
    backgroundColor: ORANGE,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionSpacing: {
    height: 18,
  },
  sliderBlock: {
    marginBottom: 32,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1A2233',
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1A2233',
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A5A5A5',
    position: 'relative',
    overflow: 'visible', // allow thumb to sit fully outside the rail
  },
  sliderProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: ORANGE,
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: ORANGE,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  categoryBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1A2233',
    marginBottom: 14,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2233',
  },
  pillTextActive: {
    color: '#fff',
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
