import ArrowBackSvg from '@/assets/images/arrow-back.svg';
import SaveIconSvg from '@/assets/images/save-icon.svg';
import AppHeader from '@/components/app-header';
import { getDiscoveryPreferences, getUserInterests, updateDiscoveryPreferences, updateUserInterests, UserInterestsInput } from '@/hooks/useAuthApi';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeTouchEvent, PanResponder, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

const CATEGORY_OPTIONS = [
  { key: 'technology', label: 'Technologie' },
  { key: 'ict', label: 'ICT' },
  { key: 'investing', label: 'Investeren' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'media', label: 'Media' },
  { key: 'production', label: 'Productie' },
  { key: 'education', label: 'Educatie' },
];

const CATEGORY_KEY_BY_LABEL = CATEGORY_OPTIONS.reduce<Record<string, string>>((acc, opt) => {
  const lower = opt.label.toLowerCase();
  acc[opt.key.toLowerCase()] = opt.key;
  acc[lower] = opt.key;
  acc[lower.replace(/\s+/g, '_')] = opt.key;
  return acc;
}, {});

const FILTER_CACHE_KEY = 'user_filters_cache_v1';

export default function FiltersPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(25);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [locationWarning, setLocationWarning] = useState('');
  const [trackWidth, setTrackWidth] = useState(280); // start with a reasonable width for initial layout
  const trackWidthRef = useRef(280);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cachedLoaded, setCachedLoaded] = useState(false);

  const SLIDER_MIN = 0;
  const SLIDER_MAX = 120;

  useEffect(() => {
    navigation?.setOptions?.({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  const normalizeBoolean = useCallback((val: any) => {
    if (val === true) return true;
    if (val === 1) return true;
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return false;
  }, []);

  const readCachedFilters = useCallback(async () => {
    try {
      const raw = await SecureStore.getItemAsync(FILTER_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed) return null;
      return {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        distance: Number.isFinite(parsed.distance) ? parsed.distance : undefined,
      };
    } catch {
      return null;
    }
  }, []);

  const writeCachedFilters = useCallback(async (categories: string[], distance: number) => {
    try {
      await SecureStore.setItemAsync(
        FILTER_CACHE_KEY,
        JSON.stringify({ categories, distance }),
      );
    } catch {
      // best-effort cache
    }
  }, []);

  const normalizeCategoryValue = useCallback((value: any) => {
    const candidate = typeof value === 'string' ? value : value?.key || value?.name || value?.label || value?.title;
    if (typeof candidate !== 'string') return null;
    const lower = candidate.trim().toLowerCase();
    const simplified = lower.replace(/\s+/g, '_');
    return CATEGORY_KEY_BY_LABEL[lower] || CATEGORY_KEY_BY_LABEL[simplified] || null;
  }, []);

  const collectCategoriesFromApi = useCallback((data: UserInterestsInput) => {
    console.log('[FiltersPage] collectCategoriesFromApi input:', data);
    
    // Collect from interests array
    const fromArray = Array.isArray(data?.interests) 
      ? data.interests.filter((key): key is string => typeof key === 'string')
      : [];

    // Collect from boolean flags
    const fromBooleans = CATEGORY_OPTIONS.filter(opt =>
      normalizeBoolean(data?.[opt.key as keyof UserInterestsInput]),
    ).map(opt => opt.key);

    const result = Array.from(new Set([...fromArray, ...fromBooleans]));
    console.log('[FiltersPage] Collected categories:', result);
    return result;
  }, [normalizeBoolean]);

  const checkLocationPermission = useCallback(async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        setLocationStatus('granted');
        setLocationWarning('');
        return true;
      }
      setLocationStatus('denied');
      setLocationWarning('Geef de app toegang tot je locatie om de afstandsfilter te bewaren.');
      return false;
    } catch {
      setLocationStatus('unknown');
      setLocationWarning('Kon locatie rechten niet controleren. Controleer je instellingen.');
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        setLocationStatus('granted');
        setLocationWarning('');
        return true;
      }
      setLocationStatus('denied');
      setLocationWarning('Locatietoegang is nodig om de afstandsfilter te gebruiken.');
      setErrorMessage('Geef locatietoegang om de afstandsfilter op te slaan.');
      return false;
    } catch {
      setErrorMessage('Locatietoestemming opvragen mislukt.');
      return false;
    }
  }, []);

  const loadFilters = useCallback(async () => {
    setLoadingFilters(true);
    setErrorMessage('');
    try {
      // Load interests
      const data = await getUserInterests();
      const activeCategories = collectCategoriesFromApi(data);
      if (activeCategories.length) {
        setSelectedCategories(activeCategories);
      } else if (!cachedLoaded) {
        const cached = await readCachedFilters();
        if (cached?.categories?.length) {
          setSelectedCategories(cached.categories);
        }
      }
      
      // Load discovery preferences (radius_km)
      try {
        const discoveryPrefs = await getDiscoveryPreferences();
        if (discoveryPrefs?.radius_km && Number.isFinite(discoveryPrefs.radius_km)) {
          const clamped = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(discoveryPrefs.radius_km)));
          setSliderValue(clamped);
        }
      } catch (discoveryErr: any) {
        console.log('[FiltersPage] Could not load discovery preferences:', discoveryErr?.message);
        // Fall back to cached value if API fails
        if (!cachedLoaded) {
          const cached = await readCachedFilters();
          if (Number.isFinite(cached?.distance as number)) {
            const clamped = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(cached?.distance as number)));
            setSliderValue(clamped);
          }
        }
      }
      
      setCachedLoaded(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Kon filters niet laden');
      const cached = await readCachedFilters();
      if (cached?.categories?.length) {
        setSelectedCategories(cached.categories);
      }
      if (Number.isFinite(cached?.distance as number)) {
        const clamped = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(cached?.distance as number)));
        setSliderValue(clamped);
      }
    } finally {
      setLoadingFilters(false);
    }
  }, [collectCategoriesFromApi, cachedLoaded, readCachedFilters]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const ratio = useMemo(() => {
    const r = (sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
    return Math.max(0, Math.min(1, r));
  }, [sliderValue]);

  const currentWidth = trackWidth || 1;
  const thumbTranslate = Math.min(Math.max(ratio * currentWidth - 12, -12), currentWidth - 12);
  const progressWidth = Math.max(0, Math.min(currentWidth, thumbTranslate + 12)); // align fill to thumb center

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: e => {
          updateValueFromX(e.nativeEvent.locationX);
        },
        onPanResponderMove: (_, gestureState) => {
          // gestureState.dx is relative movement; derive absolute position from ratio + dx
          const width = Math.max(trackWidthRef.current, 1);
          const absoluteX = ratio * width + gestureState.dx;
          updateValueFromX(absoluteX);
        },
      }),
    [ratio],
  );

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
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

  const handleSave = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setSaving(true);
    try {
      const hasLocationPermission = locationStatus === 'granted' ? true : await requestLocationPermission();
      if (!hasLocationPermission) {
        setSaving(false);
        return;
      }
      
      // Save interests
      const interestsPayload: UserInterestsInput = {
        interests: selectedCategories,
        categories: selectedCategories,
      };
      CATEGORY_OPTIONS.forEach(opt => {
        interestsPayload[opt.key as keyof UserInterestsInput] = selectedCategories.includes(opt.key);
      });
      // Zorg dat niet-geselecteerde categorieen expliciet false worden meegestuurd
      CATEGORY_OPTIONS.forEach(opt => {
        if (interestsPayload[opt.key as keyof UserInterestsInput] === undefined) {
          interestsPayload[opt.key as keyof UserInterestsInput] = false;
        }
      });
      
      await updateUserInterests(interestsPayload);
      
      // Save discovery preferences (radius_km) separately
      await updateDiscoveryPreferences(sliderValue);
      
      await writeCachedFilters(selectedCategories, sliderValue);
      setStatusMessage('Filters opgeslagen');
      await loadFilters(); // herladen zodat UI direct de opgeslagen waarden laat zien
    } catch (err: any) {
      setErrorMessage(err?.message || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Filters aanpassen"
        backgroundColor="#F6F6F6"
        leading={
          <TouchableOpacity style={styles.backCircle} activeOpacity={0.8} onPress={() => router.replace('/(tabs)')}>
            <ArrowBackSvg width={22} height={22} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        bounces={false}>
        {(!!statusMessage || !!errorMessage || !!locationWarning) && (
          <View style={styles.messageBox}>
            {!!statusMessage && <Text style={styles.statusText}>{statusMessage}</Text>}
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            {!!locationWarning && !errorMessage && <Text style={styles.warningText}>{locationWarning}</Text>}
          </View>
        )}
        <View style={styles.sectionSpacing} />
        <View style={styles.sliderBlock}>
          <View style={styles.sliderLabelRow}>
            <Text style={styles.sliderLabel}>Maximumafstand die getoond wordt</Text>
            <Text style={styles.sliderValue}>{sliderValue}km</Text>
          </View>
          <View
            style={styles.sliderTrack}
            onLayout={handleTrackLayout}
            {...panResponder.panHandlers}>
            <View style={styles.sliderRail} />
            <View style={[styles.sliderProgress, { width: progressWidth }]} />
            <View style={[styles.sliderThumb, { transform: [{ translateX: thumbTranslate }] }]} />
          </View>
        </View>
        {locationStatus !== 'granted' && (
          <View style={styles.locationNotice}>
            <Text style={styles.locationNoticeText}>Sta locatie toe zodat we de afstandsfilter kunnen toepassen.</Text>
            <TouchableOpacity style={styles.locationButton} activeOpacity={0.85} onPress={requestLocationPermission}>
              <Text style={styles.locationButtonText}>Sta locatie toe</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>Filter op categorie</Text>
          <View style={styles.pillWrap}>
            {CATEGORY_OPTIONS.map(cat => {
              const active = selectedCategories.includes(cat.key);
              const toggle = () =>
                setSelectedCategories(prev =>
                  prev.includes(cat.key) ? prev.filter(c => c !== cat.key) : [...prev, cat.key],
                );
              return (
                <TouchableOpacity key={cat.key} activeOpacity={0.85} onPress={toggle} style={[styles.pill, active && styles.pillActive]}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.saveButton, (saving || loadingFilters) && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving || loadingFilters}>
            <Text style={styles.saveButtonText}>{saving ? 'Opslaan...' : 'Opslaan'}</Text>
            <SaveIconSvg width={18} height={18} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Removed custom navigation bar */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionSpacing: {
    height: 18,
  },
  messageBox: {
    marginTop: 12,
    marginBottom: 6,
  },
  statusText: {
    color: '#0a7a0a',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#d11',
    fontSize: 13,
    textAlign: 'center',
  },
  warningText: {
    color: '#9a6b00',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
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
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  sliderRail: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sliderProgress: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  sliderThumb: {
    position: 'absolute',
    top: 4,
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
  locationNotice: {
    backgroundColor: '#FFF4E0',
    borderColor: '#FFCA7A',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    gap: 8,
  },
  locationNoticeText: {
    color: '#9a6b00',
    fontSize: 13,
    fontWeight: '600',
  },
  locationButton: {
    alignSelf: 'flex-start',
    backgroundColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
