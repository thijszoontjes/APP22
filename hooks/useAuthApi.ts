import { Buffer } from "buffer";
import { BASE_URLS, CHAT_BASE_URLS, NOTIFICATION_BASE_URLS } from "../constants/api";
import { clearAuthToken, getAuthTokens, saveAuthTokens } from "./authStorage";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
  refresh_expires_in?: number;
  // Soms komen tokens camelCased terug.
  accessToken?: string;
  refreshToken?: string;
}

export interface RegisterPayload {
  biography?: string;
  country?: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone_number: string;
  job_function?: string;
  keycloak_id?: string;
  sector?: string;
  is_blocked?: boolean;
}

export interface UserModel {
  biography?: string;
  country?: string;
  email: string;
  first_name: string;
  id?: string | number;  // Can be string (from backend) or number (parsed)
  is_blocked?: boolean;
  job_function?: string;
  keycloak_id?: string;
  last_name: string;
  password?: string;
  phone_number?: string;
  sector?: string;
}

export interface UserInterestsInput {
  education?: boolean;
  ict?: boolean;
  investing?: boolean;
  marketing?: boolean;
  media?: boolean;
  production?: boolean;
  technology?: boolean;
  interests?: string[];
  categories?: string[];
  distance?: number;
  max_distance?: number;
  distance_km?: number;
  max_distance_km?: number;
  latitude?: number;
  longitude?: number;
  location_enabled?: boolean;
  location_permission?: boolean;
  [key: string]: boolean | number | string[] | undefined;
}

export interface SendMessageRequest {
  content: string;
  receiver_email: string;
}

export interface ChatMessage {
  content: string;
  created_at: string;
  id: string | number;
  receiver_email?: string;
  sender_email?: string;
}

export interface NotificationRequest {
  email: string;
  type: string;
  message: string;
  title?: string;
}

export interface NotificationResponse {
  status?: "scheduled" | "no_preferences" | "no_notification" | string;
  channels?: string[];
  message?: string;
  error?: string;
}

let searchEndpointMissingLogged = false;
const logMissingSearchEndpointOnce = () => {
  if (!searchEndpointMissingLogged) {
    console.warn("[searchUsers] Geen /users/search endpoint gevonden in de huidige backend (swagger mist deze ook). Vallen terug op volledige lijst + client-side filter.");
    searchEndpointMissingLogged = true;
  }
};

const REQUEST_TIMEOUT_MS = 6000;
const RETRY_STATUSES = new Set([404, 502, 503, 504]);

// Fetch helper met abort/timeout zodat we duidelijke feedback geven ipv oneindig wachten.
const fetchWithTimeout = async (url: string, options: RequestInit) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(
        `Verbinding duurde te lang.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const parseErrorMessage = async (res: Response) => {
  try {
    const text = await res.text();
    if (!text) return `Er is iets misgegaan (HTTP ${res.status})`;
    const lower = text.toLowerCase();
    if (lower.includes("<html") || lower.includes("<!doctype")) {
      return `Server tijdelijk niet beschikbaar (HTTP ${res.status}). Probeer het later opnieuw.`;
    }
    try {
      const data = JSON.parse(text);
      if (typeof data === "string") return data;
      if (data?.message) return data.message;
      return text;
    } catch {
      return text;
    }
  } catch {
    return "Er is iets misgegaan";
  }
};

const normalizeNetworkError = (err: any) => {
  const message: string = err?.message;
  if (message?.toLowerCase().includes("network request failed")) {
    const baseHint = BASE_URLS.join(" of ");
    return `Kan geen verbinding maken met de server (${baseHint}). Controleer je internetverbinding of probeer het later opnieuw.`;
  }
  return message || "Network error";
};

const normalizeTokenResponse = (data: any): TokenResponse => {
  if (!data || typeof data !== "object") {
    throw new Error("Ongeldige login-response (lege payload).");
  }
  const access_token = data.access_token || data.accessToken;
  const refresh_token = data.refresh_token || data.refreshToken;
  if (!access_token || !refresh_token) {
    throw new Error("Ongeldige login-response: ontbrekende tokens.");
  }
  return {
    access_token,
    refresh_token,
    expires_in: data.expires_in ?? data.expiresIn ?? 0,
    refresh_expires_in: data.refresh_expires_in ?? data.refreshExpiresIn ?? undefined,
    token_type: data.token_type || data.tokenType || "Bearer",
  };
};

const extractSubFromAccessToken = async (): Promise<string | null> => {
  try {
    const { accessToken } = await getAuthTokens();
    if (!accessToken) return null;
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json);
    return payload?.sub || payload?.user_id || payload?.userId || null;
  } catch {
    return null;
  }
};

const decodeToken = (token: string): any | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenExpiringSoon = (token: string, bufferSeconds: number = 300): boolean => {
  const payload = decodeToken(token);
  if (!payload?.exp) return true; // Als we exp niet kunnen lezen, assume expired
  const expiresAt = payload.exp * 1000; // JWT exp is in seconds, convert to ms
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  // Token is expiring soon if less than bufferSeconds (default 5 min) remaining
  return timeUntilExpiry < (bufferSeconds * 1000);
};

/**
 * Controleert of de huidige sessie nog geldig is en refresht indien nodig.
 * Roep dit aan bij app start of wanneer je zeker wilt zijn dat de sessie geldig is.
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { accessToken, refreshToken } = await getAuthTokens();
    if (!accessToken || !refreshToken) {
      return false; // Geen tokens = niet ingelogd
    }

    // Check of access token binnenkort verloopt (binnen 5 minuten)
    if (isTokenExpiringSoon(accessToken, 300)) {
      console.log('[Auth] Access token verloopt binnenkort, probeer te refreshen...');
      try {
        const refreshed = await refreshApi(refreshToken);
        if (refreshed?.access_token && refreshed?.refresh_token) {
          await saveAuthTokens(refreshed.access_token, refreshed.refresh_token);
          console.log('[Auth] Tokens succesvol gerefreshed');
          return true;
        }
      } catch (err: any) {
        console.error('[Auth] Refresh failed:', err?.message);
        // Als refresh faalt, clear tokens
        await clearAuthToken();
        return false;
      }
    }

    return true; // Token is nog geldig
  } catch (err) {
    console.error('[Auth] ensureValidSession error:', err);
    return false;
  }
}

const requestWithFallback = async (paths: string[], init: RequestInit, bases: string[] = BASE_URLS): Promise<Response> => {
  let lastError: Error | null = null;
  const targets = paths.flatMap((path) => bases.map((base) => ({
    base,
    url: `${base}${path}`,
  })));

  for (const { url } of targets) {
    try {
      const res = await fetchWithTimeout(url, init);
      if (!RETRY_STATUSES.has(res.status)) {
        return res;
      }
      lastError = new Error(`Endpoint gaf status ${res.status} op ${url}`);
      // probeer volgende target
    } catch (err: any) {
      // timeouts of netwerkfouten: probeer volgende target
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError) {
    const bases = BASE_URLS.join(", ");
    throw new Error(`${lastError.message} (geprobeerd op: ${bases})`);
  }
  throw new Error("Onbekende fout: geen respons van de server.");
};

const refreshApi = async (refresh_token: string): Promise<TokenResponse> => {
  if (!refresh_token) {
    throw new Error("Geen refresh token beschikbaar; log opnieuw in.");
  }
  try {
    const res = await requestWithFallback(
      ["/api/auth/refresh", "/auth/refresh"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token }),
      },
    );
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      throw new Error(await parseErrorMessage(res));
    }
    const data = await res.json();
    return normalizeTokenResponse(data);
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
};

const withAutoRefresh = async (paths: string[], options: RequestInit = {}, bases: string[] = BASE_URLS): Promise<Response> => {
  const { accessToken, refreshToken } = await getAuthTokens();
  if (!accessToken || !refreshToken) {
    throw new Error("Geen sessie gevonden. Log opnieuw in.");
  }

  // Proactief refreshen als token binnenkort verloopt
  if (isTokenExpiringSoon(accessToken, 300)) {
    try {
      console.log('[Auth] Access token verloopt binnenkort, refresh proactief...');
      const refreshed = await refreshApi(refreshToken);
      if (refreshed?.access_token && refreshed?.refresh_token) {
        await saveAuthTokens(refreshed.access_token, refreshed.refresh_token);
        console.log('[Auth] Proactieve refresh geslaagd');
        // Gebruik nieuwe token voor het verzoek
        return await requestWithFallback(paths, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${refreshed.access_token}`,
          },
        }, bases);
      }
    } catch (err: any) {
      console.warn('[Auth] Proactieve refresh mislukt, probeer met huidige token:', err?.message);
      // Fall through naar normale flow
    }
  }

  const baseHeaders = (options.headers as Record<string, string> | undefined) || {};
  const headersWithAuth = {
    ...baseHeaders,
    Authorization: `Bearer ${accessToken}`,
  };

  const attempt = async (token: string) =>
    requestWithFallback(paths, {
      ...options,
      headers: { ...headersWithAuth, Authorization: `Bearer ${token}` },
    }, bases);

  let res = await attempt(accessToken);

  if (res.status === 401) {
    // Reactief refresh als 401
    try {
      console.log('[Auth] 401 ontvangen, probeer refresh...');
      const refreshed = await refreshApi(refreshToken);
      if (!refreshed?.access_token || !refreshed?.refresh_token) {
        await clearAuthToken();
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      await saveAuthTokens(refreshed.access_token, refreshed.refresh_token);
      res = await attempt(refreshed.access_token);
      if (res.status === 401) {
        await clearAuthToken();
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
    } catch (err: any) {
      await clearAuthToken();
      throw new Error(err?.message || "Sessie verlopen. Log opnieuw in.");
    }
  }

  return res;
};

export async function loginApi(payload: LoginRequest): Promise<TokenResponse> {
  try {
    const res = await requestWithFallback(
      ["/api/auth/login", "/auth/login"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const errorMsg = await parseErrorMessage(res);
      
      if (res.status === 401) {
        // Toon de echte backend foutmelding bij 401 voor betere debugging
        throw new Error(errorMsg || "Account niet gevonden of wachtwoord onjuist");
      }
      if (res.status >= 500) {
        throw new Error("Server tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      throw new Error(errorMsg);
    }
    const data = await res.json();
    return normalizeTokenResponse(data);
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function registerApi(payload: RegisterPayload): Promise<UserModel> {
  try {
    // Stuur alleen ingevulde velden mee; laat keycloak_id weg zodat de backend deze zelf kan genereren
    const requestBody: Partial<RegisterPayload> = {};
    Object.entries(payload).forEach(([key, value]) => {
      // Skip keycloak_id - de backend genereert deze na Keycloak registratie
      if (key !== 'keycloak_id' && value !== undefined && value !== "") {
        // @ts-ignore - dynamisch samenstellen
        requestBody[key] = value;
      }
    });
    const res = await requestWithFallback(
      ["/api/users/register", "/users/register"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );
    if (!res.ok) {
      const msg = await parseErrorMessage(res);
      const lowerMsg = msg.toLowerCase();
      
      // Specifieke foutmeldingen voor verschillende situaties
      if (lowerMsg.includes("duplicate") && lowerMsg.includes("email")) {
        throw new Error("Dit e-mailadres is al geregistreerd. Probeer in te loggen of gebruik 'Wachtwoord vergeten'.");
      }
      
      if (lowerMsg.includes("duplicate") && lowerMsg.includes("keycloak")) {
        throw new Error("Er is een probleem met de registratie. Probeer opnieuw of neem contact op met support. (Backend database issue)");
      }
      
      // Voor andere fouten, toon de originele backend melding
      throw new Error(msg);
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

/**
 * Vraag een wachtwoord reset aan voor een email adres.
 * Als het email adres bestaat, wordt een reset email gestuurd met een token.
 * Retourneert altijd 200 om te voorkomen dat je kan checken welke emails bestaan.
 */
export async function forgotPasswordApi(email: string): Promise<{ message: string; token?: string }> {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[forgotPasswordApi] 📧 PASSWORD RESET REQUEST');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[forgotPasswordApi] Email:', email);
    console.log('[forgotPasswordApi] Timestamp:', new Date().toISOString());
    console.log('[forgotPasswordApi] Available base URLs:', BASE_URLS);
    console.log('');
    
    const res = await requestWithFallback(
      ["/api/auth/forgot-password", "/auth/forgot-password"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );
    
    console.log('[forgotPasswordApi] ✓ Response received:');
    console.log('[forgotPasswordApi]   - Status:', res.status);
    console.log('[forgotPasswordApi]   - Status Text:', res.statusText);
    console.log('[forgotPasswordApi]   - URL:', res.url);
    console.log('[forgotPasswordApi]   - Headers:', Object.fromEntries(res.headers.entries()));
    console.log('');
    
    if (!res.ok) {
      const msg = await parseErrorMessage(res);
      console.error('[forgotPasswordApi] ✗ Request failed:', msg);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      throw new Error(msg);
    }
    
    const text = await res.text();
    console.log('[forgotPasswordApi] Response body (raw):', text);
    
    const data = text ? JSON.parse(text) : null;
    console.log('[forgotPasswordApi] Parsed response:', JSON.stringify(data, null, 2));
    
    // Check of er een token in de response zit (beveiligingsprobleem)
    if (data && data.token) {
      console.log('');
      console.log('[forgotPasswordApi] ⚠️  SECURITY ISSUE DETECTED:');
      console.log('[forgotPasswordApi]   Backend returns token in API response!');
      console.log('[forgotPasswordApi]   Token should ONLY be sent via email.');
      console.log('[forgotPasswordApi]   Anyone who knows the email can reset the password!');
      console.log('');
    }
    
    // Check of backend aangeeft dat email gestuurd wordt
    if (data && data.message) {
      console.log('[forgotPasswordApi] Backend message:', data.message);
      
      if (data.message.toLowerCase().includes('sent') || data.message.toLowerCase().includes('verstuurd')) {
        console.log('[forgotPasswordApi] ✓ Backend indicates email will be sent');
        console.log('[forgotPasswordApi] 📧 Check your email inbox and spam folder');
      } else {
        console.log('[forgotPasswordApi] ⚠️  Backend message unclear about email status');
      }
    }
    
    console.log('');
    console.log('[forgotPasswordApi] ℹ️  IF YOU DO NOT RECEIVE AN EMAIL:');
    console.log('[forgotPasswordApi]   1. Check spam/junk folder');
    console.log('[forgotPasswordApi]   2. Verify email exists in system');
    console.log('[forgotPasswordApi]   3. Backend may not have email service configured (SMTP)');
    console.log('[forgotPasswordApi]   4. Ask backend team to check email service logs');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    return data || { message: "Als dit email adres bestaat, is er een resetlink verstuurd." };
  } catch (err: any) {
    console.error('');
    console.error('[forgotPasswordApi] ✗ EXCEPTION OCCURRED:');
    console.error('[forgotPasswordApi] Error:', err);
    console.error('[forgotPasswordApi] Message:', err?.message);
    console.error('[forgotPasswordApi] Stack:', err?.stack);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    throw new Error(normalizeNetworkError(err));
  }
}

/**
 * Reset het wachtwoord met de token uit de email.
 * @param token - De token uit de reset email
 * @param newPassword - Het nieuwe wachtwoord
 */
export async function resetPasswordApi(token: string, newPassword: string): Promise<{ message: string }> {
  try {
    const res = await requestWithFallback(
      ["/api/auth/reset-password", "/auth/reset-password"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token, 
          new_password: newPassword 
        }),
      },
    );
    
    if (!res.ok) {
      const msg = await parseErrorMessage(res);
      
      if (res.status === 401) {
        throw new Error("De resetlink is ongeldig of verlopen. Vraag een nieuwe aan.");
      }
      
      throw new Error(msg);
    }
    
    const data = await res.json();
    return data || { message: "Wachtwoord succesvol gereset." };
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function getDiscoveryPreferences(): Promise<{ email: string; radius_km: number }> {
  try {
    const res = await withAutoRefresh(
      ["/users/me/discovery-preferences", "/api/users/me/discovery-preferences"],
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) {
      if (res.status >= 500) {
        throw new Error("Server tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      throw new Error(await parseErrorMessage(res));
    }
    
    const data = await res.json();
    console.log('[getDiscoveryPreferences] API response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function updateDiscoveryPreferences(radius_km: number): Promise<{ email: string; radius_km: number }> {
  try {
    const apiPayload = { radius_km };

    console.log('[updateDiscoveryPreferences] Sending payload:', JSON.stringify(apiPayload, null, 2));

    const res = await withAutoRefresh(
      ["/users/me/discovery-preferences", "/api/users/me/discovery-preferences"],
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      },
    );
    if (!res.ok) {
      if (res.status >= 500) {
        throw new Error("Server tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      const errorMsg = await parseErrorMessage(res);
      console.error('[updateDiscoveryPreferences] API error:', errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await res.json();
    console.log('[updateDiscoveryPreferences] API response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function getUserInterests(): Promise<UserInterestsInput> {
  try {
    const res = await withAutoRefresh(
      ["/users/me/interests", "/api/users/me/interests"],
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) {
      if (res.status >= 500) {
        throw new Error("Server tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      throw new Error(await parseErrorMessage(res));
    }
    
    const data = await res.json();
    console.log('[getUserInterests] API response:', JSON.stringify(data, null, 2));
    
    // Map IDs back to category keys
    const ID_TO_CATEGORY_MAP: Record<number, string> = {
      1: 'technology',
      2: 'ict',
      3: 'investing',
      4: 'marketing',
      5: 'media',
      6: 'production',
      7: 'education',
    };
    
    // Parse the API response format
    const result: UserInterestsInput = {};
    
    // Handle interests array from API (format: [{id, key, value}])
    if (data.interests && Array.isArray(data.interests)) {
      const activeInterests: string[] = [];
      
      data.interests.forEach((item: any) => {
        const categoryKey = ID_TO_CATEGORY_MAP[item.id] || item.key;
        if (categoryKey && item.value === true) {
          activeInterests.push(categoryKey);
          result[categoryKey as keyof UserInterestsInput] = true;
        } else if (categoryKey) {
          result[categoryKey as keyof UserInterestsInput] = false;
        }
      });
      
      result.interests = activeInterests;
    }
    
    return result;
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function updateUserInterests(payload: UserInterestsInput): Promise<UserInterestsInput> {
  try {
    // Map category keys to IDs (backend expects id-based format)
    const CATEGORY_ID_MAP: Record<string, number> = {
      'technology': 1,
      'ict': 2,
      'investing': 3,
      'marketing': 4,
      'media': 5,
      'production': 6,
      'education': 7,
    };

    // Collect selected categories from various sources
    const interestArray = Array.isArray(payload.interests) ? payload.interests : [];
    const interestFlags = Object.entries(payload)
      .filter(([key, value]) => typeof value === "boolean" && value === true)
      .map(([key]) => key);
    const mergedInterests = Array.from(new Set([...interestArray, ...interestFlags]));

    // Convert to API format: array of {id, value} objects
    const interestsForApi = Object.entries(CATEGORY_ID_MAP).map(([key, id]) => ({
      id,
      value: mergedInterests.includes(key),
    }));

    // Build the API payload according to Swagger spec
    const apiPayload: any = {
      interests: interestsForApi,
    };

    console.log('[updateUserInterests] Sending payload:', JSON.stringify(apiPayload, null, 2));

    const res = await withAutoRefresh(
      ["/users/me/interests", "/api/users/me/interests"],
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      },
    );
    if (!res.ok) {
      if (res.status >= 500) {
        throw new Error("Server tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      const errorMsg = await parseErrorMessage(res);
      console.error('[updateUserInterests] API error:', errorMsg);
      throw new Error(errorMsg);
    }
    // Sommige backends geven 204 No Content terug op een geslaagde update.
    if (res.status === 204) {
      return payload;
    }
    const text = await res.text();
    if (!text) return payload;
    try {
      return JSON.parse(text);
    } catch {
      return payload;
    }
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function getCurrentUserProfile(): Promise<UserModel> {
  try {
    const res = await withAutoRefresh(
      ["/api/users/me", "/users/me"],
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const text = await res.text();
    if (!text) {
      throw new Error("Kon je profiel niet ophalen (lege respons).");
    }
    return JSON.parse(text);
  } catch (err: any) {
    // Fallback: probeer keycloak-sub als de backend "invalid id" of iets vergelijkbaars teruggeeft
    const maybeMessage = String(err?.message || "").toLowerCase();
    const sub = await extractSubFromAccessToken();
    if (sub) {
      try {
        const res = await withAutoRefresh(
          [`/api/users/keycloak/${encodeURIComponent(sub)}`, `/users/keycloak/${encodeURIComponent(sub)}`],
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res));
        }
        const text = await res.text();
        if (!text) {
          throw new Error("Gebruiker gevonden maar respons was leeg.");
        }
        return JSON.parse(text);
      } catch (fallbackErr: any) {
        // laat de originele boodschap zien als fallback ook faalt
        const combined = fallbackErr?.message || err?.message || "Kon je profiel niet ophalen.";
        throw new Error(combined);
      }
    }
    throw new Error(normalizeNetworkError(err));
  }
}

export async function getUserById(userId: string | number): Promise<UserModel> {
  const id = String(userId || "").trim();
  if (!id) {
    throw new Error("Ongeldig gebruikers-id.");
  }
  const encodedId = encodeURIComponent(id);
  try {
    const res = await withAutoRefresh(
      [`/api/users/${encodedId}`, `/users/${encodedId}`],
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const text = await res.text();
    if (!text) {
      throw new Error("Gebruiker gevonden maar respons was leeg.");
    }
    return JSON.parse(text);
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

/**
 * Zoek een gebruiker op basis van voornaam en achternaam
 * Gebruikt het /users/{firstname}/{lastname} endpoint
 */
export async function getUserByName(firstName: string, lastName: string): Promise<UserModel | null> {
  if (!firstName || !lastName) {
    throw new Error('Voornaam en achternaam zijn verplicht');
  }

  try {
    const endpoint = `/users/${encodeURIComponent(firstName.trim())}/${encodeURIComponent(lastName.trim())}`;
    
    const res = await withAutoRefresh([endpoint], {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const text = await res.text();
      if (!text) return null;
      
      const data = JSON.parse(text);
      console.log('[getUserByName] Response:', data);
      
      // API retourneert UserPublicInfoResponse met email, first_name, last_name
      // We converteren dit naar UserModel formaat
      if (data && data.email) {
        return {
          email: data.email,
          first_name: data.first_name || firstName,
          last_name: data.last_name || lastName,
        } as UserModel;
      }
      
      return null;
    }

    if (res.status === 404) {
      return null; // Gebruiker niet gevonden
    }

    const errorMsg = await parseErrorMessage(res);
    console.error('[getUserByName] Error:', res.status, errorMsg);
    throw new Error(errorMsg);
  } catch (err: any) {
    console.error('[getUserByName] Failed:', err);
    throw err;
  }
}

export async function searchUsers(query: string): Promise<UserModel[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const searchTerm = query.trim();
  
  try {
    // Detecteer of de query eruit ziet als "voornaam achternaam"
    const nameParts = searchTerm.split(/\s+/).filter(part => part.length > 0);
    
    if (nameParts.length === 2) {
      // Query heeft twee woorden - probeer name-based search
      const [firstName, lastName] = nameParts;
      try {
        console.log('[searchUsers] Name-based search:', firstName, lastName);
        const user = await getUserByName(firstName, lastName);
        if (user) {
          console.log('[searchUsers] Found user:', user);
          return [user];
        } else {
          console.log('[searchUsers] No user found with this name');
          return [];
        }
      } catch (nameErr: any) {
        console.error('[searchUsers] Name search failed:', nameErr?.message);
        // Als het een 404 is, betekent het gewoon dat de gebruiker niet bestaat
        if (nameErr?.message?.includes('404') || nameErr?.message?.includes('niet gevonden')) {
          return [];
        }
        throw nameErr;
      }
    } else if (nameParts.length === 1) {
      // Één woord - geef duidelijke instructie
      throw new Error('Voer een volledige naam in (voornaam én achternaam), bijvoorbeeld: "Jan Jansen"');
    } else if (nameParts.length > 2) {
      // Meer dan twee woorden - probeer eerste + laatste
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      console.log('[searchUsers] Multiple words detected, trying first + last:', firstName, lastName);
      
      try {
        const user = await getUserByName(firstName, lastName);
        if (user) {
          return [user];
        } else {
          return [];
        }
      } catch (nameErr: any) {
        console.error('[searchUsers] Name search failed:', nameErr?.message);
        if (nameErr?.message?.includes('404') || nameErr?.message?.includes('niet gevonden')) {
          return [];
        }
        throw nameErr;
      }
    } else {
      throw new Error('Voer een naam in om te zoeken');
    }
  } catch (err: any) {
    console.error('[searchUsers] Search failed:', err);
    throw err;
  }
}

export async function fetchConversation(withUserEmail: string): Promise<ChatMessage[]> {
  const email = String(withUserEmail || "").trim();
  if (!email) {
    throw new Error("Ongeldig e-mailadres om mee te chatten.");
  }
  console.log("[ChatAPI] Haal gesprek op met:", email);
  try {
    const res = await withAutoRefresh(
      [`/chat/messages?with=${encodeURIComponent(email)}`],
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
      CHAT_BASE_URLS,
    );
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(await parseErrorMessage(res));
    }
    const text = await res.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function fetchAllMyMessages(withUserEmail: string): Promise<ChatMessage[]> {
  // Wrapper zodat callsites een e-mailadres doorgeven conform de nieuwste API docs
  return fetchConversation(withUserEmail);
}

export async function sendChatMessage(payload: SendMessageRequest): Promise<ChatMessage> {
  if (!payload?.content || !payload.receiver_email) {
    throw new Error("Bericht en ontvanger zijn verplicht.");
  }
  const receiverEmail = String(payload.receiver_email || "").trim();
  if (!receiverEmail) {
    throw new Error("Ongeldig ontvanger-e-mailadres.");
  }
  console.log("[ChatAPI] Verstuur bericht naar:", receiverEmail);
  try {
    const body: any = { ...payload, receiver_email: receiverEmail };
    const res = await withAutoRefresh(
      ["/chat/send"],
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      CHAT_BASE_URLS,
    );
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const text = await res.text();
    console.log("[ChatAPI] Response status:", res.status, "body:", text || "<leeg>");
    return text ? JSON.parse(text) : { content: payload.content, receiver_email: receiverEmail, created_at: new Date().toISOString(), id: Date.now() };
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function sendNotification(payload: NotificationRequest): Promise<NotificationResponse> {
  if (!payload?.email || !payload?.type || !payload?.message) {
    throw new Error("Notificatie mist verplichte velden (email, type, message).");
  }

  const requestBody = {
    email: payload.email,
    type: payload.type,
    message: payload.message,
    ...(payload.title ? { title: payload.title } : {}),
  };

  console.log("[NotificationAPI] Verstuur notificatie:", JSON.stringify(requestBody));

  try {
    const res = await requestWithFallback(
      ["/notify"],
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
      NOTIFICATION_BASE_URLS,
    );

    const text = await res.text();
    console.log("[NotificationAPI] Response", res.status, text || "<leeg>");

    const parseJsonSafe = () => {
      try {
        return text ? JSON.parse(text) : undefined;
      } catch {
        return undefined;
      }
    };

    if (!res.ok) {
      const parsed = parseJsonSafe();
      const messageFromBody = typeof parsed === "string"
        ? parsed
        : parsed?.error || parsed?.message || text || `Notificatie versturen mislukt (status ${res.status})`;
      throw new Error(messageFromBody);
    }

    return parseJsonSafe() || { status: "unknown", message: text || "Lege respons" };
  } catch (err: any) {
    console.warn("[NotificationAPI] Notificatie call faalde:", err?.message || err);
    throw new Error(normalizeNetworkError(err));
  }
}
