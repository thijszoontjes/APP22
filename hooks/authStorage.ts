import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

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

export const clearAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // best-effort
  }
};
