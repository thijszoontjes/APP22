import * as MediaLibrary from 'expo-media-library';

type Listener = () => void;

type PitchEntry = {
  uri: string;
  createdAt: number;
};

let pitches: PitchEntry[] = [];
const listeners = new Set<Listener>();

export async function addPitch(uri: string) {
  // Don't add to in-memory array - save directly to device storage only
  // This prevents memory buildup from storing video URIs
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.granted) {
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log('Video saved to media library:', asset.uri);
    }
  } catch (err) {
    console.warn('Could not save to media library:', err);
  }
  
  // Notify listeners but don't add to array
  // (Array stays empty, preventing memory accumulation)
}

export function getPitches() {
  return pitches;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
