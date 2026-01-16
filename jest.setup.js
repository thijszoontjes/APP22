// Mock Expo winter module system BEFORE anything else imports it
jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal', () => ({}), { virtual: true });

// Suppress Expo warnings - disable winter module
global.__ExpoImportMetaRegistry = new Proxy({}, {
  get: () => undefined,
  set: () => true,
});
global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));
global.TextDecoder = global.TextDecoder || class { decode() { return ''; } };
global.TextEncoder = global.TextEncoder || class { encode() { return new Uint8Array(); } };
global.TextDecoderStream = global.TextDecoderStream || class {};
global.TextEncoderStream = global.TextEncoderStream || class {};
global.ReadableStream = global.ReadableStream || class {};
global.WritableStream = global.WritableStream || class {};
global.TransformStream = global.TransformStream || class {};

jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: 'Screen',
  },
  Tabs: 'Tabs',
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Video: 'Video',
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock expo-video
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replay: jest.fn(),
    currentTime: 0,
  })),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn(),
  ]),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// Global fetch mock
global.fetch = jest.fn();

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
