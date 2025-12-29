import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { updateNotificationPreferences } from "./useAuthApi";

const PUSH_TOKEN_KEY = "expo_push_token_v1";

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Constants.isDevice) {
    console.log("[Push] Push tokens werken alleen op een fysiek device.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    console.warn("[Push] Push permissie geweigerd.");
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();

  const token = tokenResponse.data;
  if (!token) {
    console.warn("[Push] Geen expo push token ontvangen.");
    return null;
  }

  const lastToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (lastToken !== token) {
    await updateNotificationPreferences({ chat_push: true, expo_push_token: token });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    console.log("[Push] Expo push token opgeslagen in user preferences.");
  }

  return token;
};
