import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const HOME_HINT_KEY = "home_scroll_hint_seen";

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
