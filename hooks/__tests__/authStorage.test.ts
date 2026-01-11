/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { 
  getToken, 
  setToken, 
  removeToken, 
  getRefreshToken, 
  setRefreshToken 
} from '../authStorage';

jest.mock('expo-secure-store');

describe('authStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('should return token from secure store', async () => {
      const mockToken = 'test-token-123';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockToken);

      const token = await getToken();

      expect(token).toBe(mockToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
    });

    it('should return null if no token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const token = await getToken();

      expect(token).toBeNull();
    });
  });

  describe('setToken', () => {
    it('should store token in secure store', async () => {
      const mockToken = 'new-token-456';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await setToken(mockToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', mockToken);
    });
  });

  describe('removeToken', () => {
    it('should remove token from secure store', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await removeToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from secure store', async () => {
      const mockRefreshToken = 'refresh-token-789';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockRefreshToken);

      const token = await getRefreshToken();

      expect(token).toBe(mockRefreshToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('setRefreshToken', () => {
    it('should store refresh token in secure store', async () => {
      const mockRefreshToken = 'new-refresh-token';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await setRefreshToken(mockRefreshToken);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', mockRefreshToken);
    });
  });
});
