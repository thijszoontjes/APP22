/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { 
  getStoredToken,
  saveAuthToken,
  clearAuthToken,
  getAuthTokens,
  saveAuthTokens
} from '../authStorage';

jest.mock('expo-secure-store');

describe('authStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoredToken', () => {
    it('should return token from secure store', async () => {
      const mockToken = 'test-token-123';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockToken);

      const token = await getStoredToken();

      expect(token).toBe(mockToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null if no token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const token = await getStoredToken();

      expect(token).toBeNull();
    });
  });

  describe('saveAuthToken', () => {
    it('should store token in secure store', async () => {
      const mockToken = 'new-token-456';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await saveAuthToken(mockToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', mockToken);
    });
  });

  describe('clearAuthToken', () => {
    it('should remove tokens from secure store', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await clearAuthToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('getAuthTokens', () => {
    it('should return both tokens from secure store', async () => {
      const mockAccessToken = 'access-token-789';
      const mockRefreshToken = 'refresh-token-123';
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const tokens = await getAuthTokens();

      expect(tokens.accessToken).toBe(mockAccessToken);
      expect(tokens.refreshToken).toBe(mockRefreshToken);
    });
  });

  describe('saveAuthTokens', () => {
    it('should store both tokens in secure store', async () => {
      const mockAccessToken = 'new-access-token';
      const mockRefreshToken = 'new-refresh-token';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await saveAuthTokens(mockAccessToken, mockRefreshToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', mockAccessToken);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', mockRefreshToken);
    });
  });
});
