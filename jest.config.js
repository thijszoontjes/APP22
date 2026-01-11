module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s',
  ],
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/.expo/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.js',
  ],
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/components/__tests__/',
    '/hooks/__tests__/',
  ],
};
