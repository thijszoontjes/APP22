import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const HOME_HINT_KEY = "home_scroll_hint_seen";
const LAST_CHATS_KEY = "last_chats_v1";
const LAST_CHATS_OWNER_KEY = "last_chats_owner_v1";
const FILTER_CACHE_KEY = "user_filters_cache_v1";
const FILTER_OWNER_KEY = "filter_owner_v1";
const LIKED_VIDEOS_KEY_PREFIX = "liked_videos_v1_";
const FAVORITED_VIDEOS_KEY_PREFIX = "favorited_videos_v1_";

// Extract user_id from access token JWT
export const getUserIdFromToken = (accessToken: string | null): string | null => {
  if (!accessToken) return null;
  try {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      const decoded = JSON.parse(atob(parts[1]));
      return decoded.sub || decoded.user_id || decoded.id || null;
    }
  } catch {
    return null;
  }
  return null;
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
};

export const saveAuthToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // geen crash bij storage issues; gebruiker kan opnieuw inloggen
  }
};

export const saveAuthTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // geen crash bij storage issues; gebruiker kan opnieuw inloggen
  }
};

export const getAuthTokens = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    return { accessToken: accessToken || null, refreshToken: refreshToken || null };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

export const clearAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(LAST_CHATS_KEY);
    await SecureStore.deleteItemAsync(LAST_CHATS_OWNER_KEY);
    await SecureStore.deleteItemAsync(FILTER_CACHE_KEY);
    await SecureStore.deleteItemAsync(FILTER_OWNER_KEY);
    // DON'T delete LIKED_VIDEOS_KEY - we want likes to persist across logout/login
  } catch {
    // best-effort
  }
};

export const getHomeHintSeen = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(HOME_HINT_KEY);
    return value === "1";
  } catch {
    return true; // laat geen overlay zien bij storage issues
  }
};

export const setHomeHintSeen = async () => {
  try {
    await SecureStore.setItemAsync(HOME_HINT_KEY, "1");
  } catch {
    // best-effort; overlay kan opnieuw verschijnen als opslaan faalt
  }
};

export const resetHomeHintSeen = async () => {
  try {
    await SecureStore.deleteItemAsync(HOME_HINT_KEY);
  } catch {
    // best-effort; hint blijft mogelijk verborgen
  }
};

export const syncChatOwner = async (email: string) => {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return;
  try {
    const currentOwner = await SecureStore.getItemAsync(LAST_CHATS_OWNER_KEY);
    if (!currentOwner) {
      const rawChats = await SecureStore.getItemAsync(LAST_CHATS_KEY);
      if (rawChats) {
        await SecureStore.deleteItemAsync(LAST_CHATS_KEY);
      }
    } else if (currentOwner !== normalized) {
      await SecureStore.deleteItemAsync(LAST_CHATS_KEY);
    }
    await SecureStore.setItemAsync(LAST_CHATS_OWNER_KEY, normalized);
  } catch {
    // best-effort
  }
};

export const syncFilterOwner = async (email: string) => {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return;
  try {
    const currentOwner = await SecureStore.getItemAsync(FILTER_OWNER_KEY);
    if (!currentOwner) {
      const rawFilters = await SecureStore.getItemAsync(FILTER_CACHE_KEY);
      if (rawFilters) {
        await SecureStore.deleteItemAsync(FILTER_CACHE_KEY);
      }
    } else if (currentOwner !== normalized) {
      await SecureStore.deleteItemAsync(FILTER_CACHE_KEY);
    }
    await SecureStore.setItemAsync(FILTER_OWNER_KEY, normalized);
  } catch {
    // best-effort
  }
};

// Liked videos management - per user
export const getLikedVideos = async (): Promise<Set<string>> => {
  try {
    const { accessToken } = await getAuthTokens();
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return new Set();
    
    const key = `${LIKED_VIDEOS_KEY_PREFIX}${userId}`;
    const json = await SecureStore.getItemAsync(key);
    if (!json) return new Set();
    const ids = JSON.parse(json) as string[];
    return new Set(ids);
  } catch (err) {
    console.warn('[Storage] Failed to get liked videos:', err);
    return new Set();
  }
};

export const addLikedVideo = async (videoId: string) => {
  try {
    const { accessToken } = await getAuthTokens();
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return;
    
    const likedVideos = await getLikedVideos();
    likedVideos.add(String(videoId));
    const key = `${LIKED_VIDEOS_KEY_PREFIX}${userId}`;
    const json = JSON.stringify(Array.from(likedVideos));
    await SecureStore.setItemAsync(key, json);
  } catch (err) {
    console.warn('[Storage] Failed to add liked video:', videoId, err);
  }
};

export const removeLikedVideo = async (videoId: string) => {
  try {
    const { accessToken } = await getAuthTokens();
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return;
    
    const likedVideos = await getLikedVideos();
    likedVideos.delete(String(videoId));
    const key = `${LIKED_VIDEOS_KEY_PREFIX}${userId}`;
    const json = JSON.stringify(Array.from(likedVideos));
    await SecureStore.setItemAsync(key, json);
  } catch (err) {
    console.warn('[Storage] Failed to remove liked video:', videoId, err);
  }
};

export const isVideoLiked = async (videoId: string): Promise<boolean> => {
  try {
    const likedVideos = await getLikedVideos();
    return likedVideos.has(String(videoId));
  } catch (err) {
    console.warn('[Storage] Failed to check if video is liked:', videoId, err);
    return false;
  }
};

// Favorited videos management - per user
export const getFavoritedVideos = async (): Promise<Set<string>> => {
  try {
    const { accessToken } = await getAuthTokens();
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return new Set();
    
    const key = `${FAVORITED_VIDEOS_KEY_PREFIX}${userId}`;
    const json = await SecureStore.getItemAsync(key);
    if (!json) return new Set();
    const ids = JSON.parse(json) as string[];
    return new Set(ids);
  } catch (err) {
    console.warn('[Storage] Failed to get favorited videos:', err);
    return new Set();
  }
};

export const addFavoritedVideo = async (videoId: string) => {
  try {
    const { accessToken } = await getAuthTokens();
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return;
    
    const favoritedVideos = await getFavoritedVideos();
    favoritedVideos.add(String(videoId));
    const key = `${FAVORITED_VIDEOS_KEY_PREFIX}${userId}`;
    const json = JSON.stringify(Array.from(favoritedVideos));
    await SecureStore.setItemAsync(key, json);
  } catch (err) {
    console.warn('[Storage] Failed to add favorited video:', videoId, err);
  }
};

export const removeFavoritedVideo = async (videoId: string) => {
  try {
    const { accessToken } = await getAuthTokens();
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return;
    
    const favoritedVideos = await getFavoritedVideos();
    favoritedVideos.delete(String(videoId));
    const key = `${FAVORITED_VIDEOS_KEY_PREFIX}${userId}`;
    const json = JSON.stringify(Array.from(favoritedVideos));
    await SecureStore.setItemAsync(key, json);
  } catch (err) {
    console.warn('[Storage] Failed to remove favorited video:', videoId, err);
  }
};

export const isVideoFavorited = async (videoId: string): Promise<boolean> => {
  try {
    const favoritedVideos = await getFavoritedVideos();
    return favoritedVideos.has(String(videoId));
  } catch (err) {
    console.warn('[Storage] Failed to check if video is favorited:', videoId, err);
    return false;
  }
};
