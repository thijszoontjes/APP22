import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const HOME_HINT_KEY = "home_scroll_hint_seen";
const LAST_CHATS_KEY = "last_chats_v1";
const LAST_CHATS_OWNER_KEY = "last_chats_owner_v1";
const FILTER_CACHE_KEY = "user_filters_cache_v1";
const FILTER_OWNER_KEY = "filter_owner_v1";

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
