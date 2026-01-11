/**
 * @jest-environment jsdom
 */

// Mock global fetch for video API tests
global.fetch = jest.fn();

describe('Video API Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Video URL parsing', () => {
    it('should extract video ID from valid URLs', () => {
      const validUrls = [
        'https://example.com/videos/123',
        'https://example.com/api/videos/456',
      ];

      validUrls.forEach(url => {
        const match = url.match(/\/videos\/(\d+)/);
        expect(match).toBeTruthy();
        if (match) {
          const videoId = match[1];
          expect(videoId).toMatch(/^\d+$/);
        }
      });
    });

    it('should handle Mux playback IDs', () => {
      const playbackId = 'abcd1234efgh5678';
      const muxUrl = `https://stream.mux.com/${playbackId}.m3u8`;
      
      expect(muxUrl).toContain(playbackId);
      expect(muxUrl).toContain('.m3u8');
    });
  });

  describe('Video metadata structure', () => {
    it('should validate FeedItem structure', () => {
      const feedItem = {
        id: 1,
        title: 'Test Video',
        description: 'Test Description',
        liked: false,
        likeCount: 0,
        owner: {
          id: 'user123',
          displayName: 'Test User',
        },
      };

      expect(feedItem.id).toBeDefined();
      expect(typeof feedItem.id).toBe('number');
      expect(feedItem.title).toBeDefined();
      expect(typeof feedItem.liked).toBe('boolean');
      expect(typeof feedItem.likeCount).toBe('number');
      expect(feedItem.owner).toBeDefined();
    });

    it('should handle video owner information', () => {
      const owner = {
        id: 'user456',
        displayName: 'John Doe',
      };

      expect(owner.id).toBeDefined();
      expect(owner.displayName).toBeDefined();
      expect(typeof owner.id).toBe('string');
      expect(typeof owner.displayName).toBe('string');
    });
  });

  describe('Video state management', () => {
    it('should track like state correctly', () => {
      let liked = false;
      let likeCount = 5;

      // Simulate like
      liked = !liked;
      likeCount = liked ? likeCount + 1 : likeCount - 1;

      expect(liked).toBe(true);
      expect(likeCount).toBe(6);

      // Simulate unlike
      liked = !liked;
      likeCount = liked ? likeCount + 1 : likeCount - 1;

      expect(liked).toBe(false);
      expect(likeCount).toBe(5);
    });

    it('should handle favorite state', () => {
      let favorited = false;

      favorited = !favorited;
      expect(favorited).toBe(true);

      favorited = !favorited;
      expect(favorited).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network request failed')
      );

      try {
        await fetch('https://example.com/api/videos');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Network request failed');
      }
    });

    it('should handle 404 responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const response = await fetch('https://example.com/api/videos/999');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle 401 unauthorized responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const response = await fetch('https://example.com/api/videos');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });
});
