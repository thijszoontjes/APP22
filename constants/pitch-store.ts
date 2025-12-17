import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as SecureStore from 'expo-secure-store';

type Listener = () => void;

type PitchEntry = {
  uri: string;
  createdAt: number;
  uploadedVideoId?: string;
};

let pitches: PitchEntry[] = [];
const listeners = new Set<Listener>();

const PITCHES_KEY = 'pitches_v1';
const MAX_PITCHES = 10;
const PITCH_DIR = `${FileSystem.documentDirectory ?? ''}pitches/`;

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
};

const persist = async () => {
  try {
    await SecureStore.setItemAsync(PITCHES_KEY, JSON.stringify(pitches));
  } catch {
    // best-effort
  }
};

const ensurePitchDir = async () => {
  if (!FileSystem.documentDirectory) return;
  try {
    const info = await FileSystem.getInfoAsync(PITCH_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(PITCH_DIR, { intermediates: true });
    }
  } catch {
    // best-effort
  }
};

// Load persisted pitches once on module init
(async () => {
  try {
    const raw = await SecureStore.getItemAsync(PITCHES_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      pitches = parsed
        .filter((p) => p && typeof p.uri === 'string' && typeof p.createdAt === 'number')
        .slice(0, MAX_PITCHES);
      notify();
    }
  } catch {
    // ignore
  }
})();

const copyToAppStorage = async (uri: string, createdAt: number): Promise<string> => {
  if (!FileSystem.documentDirectory) return uri;
  if (!/^file:\/\//i.test(uri)) return uri;

  await ensurePitchDir();
  const ext = uri.split('?')[0].toLowerCase().endsWith('.mov') ? 'mov' : 'mp4';
  const target = `${PITCH_DIR}${createdAt}.${ext}`;

  try {
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists) return target;
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch {
    return uri;
  }
};

export async function addPitch(uri: string) {
  const createdAt = Date.now();
  const storedUri = await copyToAppStorage(uri, createdAt);

  pitches = [{ uri: storedUri, createdAt }, ...pitches].slice(0, MAX_PITCHES);
  notify();
  persist();

  // Best-effort: also save to media library (may be limited in Expo Go)
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.granted) {
      const asset = await MediaLibrary.createAssetAsync(storedUri);
      console.log('Video saved to media library:', asset.uri);
    }
  } catch (err) {
    console.warn('Could not save to media library:', err);
  }
}

export function getPitches() {
  return pitches;
}

export function getLocalUriByUploadedVideoId(videoId: string | number): string | null {
  const key = String(videoId);
  const found = pitches.find((p) => p.uploadedVideoId === key);
  return found?.uri ?? null;
}

export async function markPitchUploaded(localUri: string, videoId: string | number) {
  const key = String(videoId);
  const index = pitches.findIndex((p) => p.uri === localUri);
  if (index === -1) return;
  pitches[index] = { ...pitches[index], uploadedVideoId: key };
  notify();
  await persist();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
