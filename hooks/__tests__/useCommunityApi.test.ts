/**
 * @jest-environment jsdom
 */
import * as authStorage from '../authStorage';
import {
    FavoriteResponse,
    getVideoStats,
    LikeResponse,
    toggleVideoFavorite,
    toggleVideoLike,
    VideoStats,
} from '../useCommunityApi';

// Mock authStorage
jest.mock('../authStorage');
jest.mock('@/constants/api', () => ({
  BASE_URLS: ['https://auth.example.com'],
  COMMUNITY_BASE_URLS: ['https://community.example.com'],
}));

// Mock global fetch
global.fetch = jest.fn();

describe('useCommunityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('toggleVideoLike', () => {
    it('should toggle like on a video successfully', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Like toggled',
          liked: true,
        } as LikeResponse),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (authStorage.addLikedVideo as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleVideoLike('video-123');

      expect(result.liked).toBe(true);
      expect(authStorage.addLikedVideo).toHaveBeenCalledWith('video-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle like toggle failure', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Invalid video ID' }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(toggleVideoLike('invalid-video')).rejects.toThrow();
    });

    it('should remove like if liked is false', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Like removed',
          liked: false,
        } as LikeResponse),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (authStorage.removeLikedVideo as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleVideoLike('video-123');

      expect(result.liked).toBe(false);
      expect(authStorage.removeLikedVideo).toHaveBeenCalledWith('video-123');
    });
  });

  describe('toggleVideoFavorite', () => {
    it('should toggle favorite on a video successfully', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Favorite toggled',
          favorited: true,
        } as FavoriteResponse),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (authStorage.addFavoritedVideo as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleVideoFavorite('video-456');

      expect(result.favorited).toBe(true);
      expect(authStorage.addFavoritedVideo).toHaveBeenCalledWith('video-456');
    });

    it('should remove favorite if favorited is false', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Favorite removed',
          favorited: false,
        } as FavoriteResponse),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (authStorage.removeFavoritedVideo as jest.Mock).mockResolvedValue(undefined);

      const result = await toggleVideoFavorite('video-456');

      expect(result.favorited).toBe(false);
      expect(authStorage.removeFavoritedVideo).toHaveBeenCalledWith('video-456');
    });

    it('should handle favorite toggle failure', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Invalid video ID' }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(toggleVideoFavorite('invalid-video')).rejects.toThrow();
    });
  });

  describe('getVideoStats', () => {
    it('should fetch video statistics successfully', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          video_id: 'video-789',
          likes_count: 42,
          favorites_count: 15,
          shares_count: 5,
          views_count: 1250,
        } as VideoStats),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getVideoStats('video-789');

      expect(result.likes_count).toBe(42);
      expect(result.favorites_count).toBe(15);
      expect(result.views_count).toBe(1250);
    });

    it('should return empty object if stats fetch fails', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      const mockResponse = {
        ok: false,
        status: 404,
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getVideoStats('nonexistent-video');

      expect(result).toEqual({});
    });

    it('should handle network error gracefully', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: mockToken,
        refreshToken: 'refresh-token-123',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getVideoStats('video-999');

      expect(result).toEqual({});
    });
  });

  describe('Token handling', () => {
    it('should throw error if no access token available', async () => {
      (authStorage.getAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: null,
        refreshToken: null,
      });

      await expect(toggleVideoLike('video-123')).rejects.toThrow('Geen geldige sessie');
    });
  });
});
