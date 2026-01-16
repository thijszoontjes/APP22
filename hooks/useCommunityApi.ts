import { BASE_URLS, COMMUNITY_BASE_URLS } from "@/constants/api";
import { addFavoritedVideo, addLikedVideo, clearAuthToken, getAuthTokens, removeFavoritedVideo, removeLikedVideo, saveAuthTokens } from "./authStorage";

// Helper to make requests with automatic token refresh
async function communityFetch(endpoint: string, options: RequestInit): Promise<Response> {
  let tokens = await getAuthTokens();
  
  if (!tokens?.accessToken) {
    throw new Error('Geen geldige sessie. Log opnieuw in.');
  }

  // Extract user_id from JWT token
  let userId = '';
  try {
    const parts = tokens.accessToken.split('.');
    if (parts.length === 3) {
      const decoded = JSON.parse(atob(parts[1]));
      userId = decoded.sub || decoded.user_id || decoded.id || '';
    }
  } catch (err) {
    // Continue without userId
  }

  const makeRequest = async (accessToken: string): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      'Authorization': `Bearer ${accessToken}`,
    };

    if (userId) {
      headers['User-ID'] = userId;
    }

    // Try all base URLs
    for (const baseUrl of COMMUNITY_BASE_URLS) {
      try {
        return await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
      } catch (err) {
        // Try next URL
        continue;
      }
    }

    throw new Error('Could not connect to Community Service');
  };

  // First attempt
  let res = await makeRequest(tokens.accessToken);

  // If 401, refresh and retry
  if (res.status === 401 && tokens?.refreshToken) {
    for (const baseUrl of BASE_URLS) {
      try {
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newAccessToken = data.access_token || data.accessToken;
          
          if (newAccessToken) {
            await saveAuthTokens(newAccessToken, tokens.refreshToken);
            return await makeRequest(newAccessToken);
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    await clearAuthToken();
  }

  return res;
}

export interface LikeRequest {
  video_id: string;
}

export interface LikeResponse {
  message?: string;
  status?: string;
  liked?: boolean;
  [key: string]: any;
}

export interface UserLikes {
  video_id: string;
  user_id: string;
  liked: boolean;
  created_at?: string;
  [key: string]: any;
}

/**
 * Toggle like on a video
 */
export async function toggleVideoLike(videoId: string): Promise<LikeResponse> {
  try {
    const payload: LikeRequest = {
      video_id: String(videoId), // Ensure video_id is always a string
    };

    console.log('[Community] Toggle like:', payload);

    const res = await communityFetch('/api/v1/likes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `Status ${res.status}`;
      try {
        const error = JSON.parse(text);
        errorMsg = error.message || error.error || errorMsg;
      } catch {}
      console.error('[Community] Like toggle error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('[Community] Like toggled:', data);
    
    // Save like status locally
    const videoIdStr = String(videoId);
    if (data?.liked === true) {
      await addLikedVideo(videoIdStr);
    } else if (data?.liked === false) {
      await removeLikedVideo(videoIdStr);
    }
    
    return data;
  } catch (err: any) {
    console.error('[Community] Toggle like error:', err);
    throw new Error(err?.message || 'Kon like niet toevoegen');
  }
}

/**
 * Get like status for a video (check if current user liked it)
 */
/**
 * Get video statistics including likes, favorites, comments, shares, views
 */
export interface VideoStats {
  video_id?: string;
  likes_count?: number;
  favorites_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
  [key: string]: any;
}

export async function getVideoStats(videoId: string): Promise<VideoStats> {
  try {
    console.log('[Community] Fetching stats for video:', videoId);

    const res = await communityFetch(`/api/v1/videos/${videoId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[Community] Could not fetch video stats');
      return {};
    }

    const data = await res.json();
    console.log('[Community] Video stats:', data);
    return data;
  } catch (err: any) {
    console.warn('[Community] Error fetching video stats:', err?.message);
    return {};
  }
}

/**
 * Toggle favorite on a video
 */
export interface FavoriteRequest {
  video_id: string;
}

export interface FavoriteResponse {
  message?: string;
  status?: string;
  favorited?: boolean;
  [key: string]: any;
}

export async function toggleVideoFavorite(videoId: string): Promise<FavoriteResponse> {
  try {
    const payload: FavoriteRequest = {
      video_id: String(videoId),
    };

    console.log('[Community] Toggle favorite:', payload);

    const res = await communityFetch('/api/v1/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `Status ${res.status}`;
      try {
        const error = JSON.parse(text);
        errorMsg = error.message || error.error || errorMsg;
      } catch {}
      console.error('[Community] Favorite toggle error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('[Community] Favorite toggled:', data);

    // Save favorite status locally
    const videoIdStr = String(videoId);
    if (data?.favorited === true) {
      await addFavoritedVideo(videoIdStr);
    } else if (data?.favorited === false) {
      await removeFavoritedVideo(videoIdStr);
    }

    return data;
  } catch (err: any) {
    console.error('[Community] Toggle favorite error:', err);
    throw new Error(err?.message || 'Kon favorite niet toevoegen');
  }
}

/**
 * Record a video watch
 
export interface WatchRequest {
  video_id: string;
}

export interface WatchResponse {
  message?: string;
  status?: string;
  [key: string]: any;
}

export async function recordVideoWatch(videoId: string): Promise<WatchResponse> {
  try {
    const payload: WatchRequest = {
      video_id: String(videoId),
    };

    console.log('[Community] Record watch:', payload);

    const res = await communityFetch('/api/v1/watch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `Status ${res.status}`;
      try {
        const error = JSON.parse(text);
        errorMsg = error.message || error.error || errorMsg;
      } catch {}
      console.error('[Community] Record watch error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('[Community] Watch recorded:', data);
    return data;
  } catch (err: any) {
    console.error('[Community] Record watch error:', err);
    throw new Error(err?.message || 'Kon watch niet registreren');
  }
}
  */

/**
 * Get user watch history
 */
export interface WatchHistoryItem {
  video_id: string;
  user_id: string;
  watched_at: string;
  [key: string]: any;
}

export interface WatchHistoryResponse {
  items: WatchHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  [key: string]: any;
}

export async function getWatchHistory(page: number = 1, pageSize: number = 100): Promise<WatchHistoryResponse> {
  try {
    console.log('[Community] Fetching watch history');

    const res = await communityFetch(`/api/v1/watch-history?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[Community] Could not fetch watch history');
      return { items: [], total: 0, page: 1, page_size: pageSize };
    }

    const data = await res.json();
    console.log('[Community] Watch history:', data?.items?.length || 0, 'items');
    return data;
  } catch (err: any) {
    console.warn('[Community] Error fetching watch history:', err?.message);
    return { items: [], total: 0, page: 1, page_size: pageSize };
  }
}
