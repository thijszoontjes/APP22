type Listener = () => void;

type PitchEntry = {
  uri: string;
  createdAt: number;
};

let pitches: PitchEntry[] = [];
const listeners = new Set<Listener>();

export function addPitch(uri: string) {
  pitches = [{ uri, createdAt: Date.now() }, ...pitches];
  listeners.forEach(fn => fn());
}

export function getPitches() {
  return pitches;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
