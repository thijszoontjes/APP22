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
  receiver_id: number;
}

export interface ChatMessage {
  content: string;
  created_at: string;
  id: number;
  receiver_id: number;
  sender_id: number;
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

export async function getUserById(userId: number): Promise<UserModel> {
  if (!Number.isFinite(userId)) {
    throw new Error("Ongeldig gebruikers-id.");
  }
  try {
    const res = await withAutoRefresh(
      [`/api/users/${userId}`, `/users/${userId}`],
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

export async function searchUsers(query: string): Promise<UserModel[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const searchTerm = query.trim().toLowerCase();
  
  try {
    // Strategie 1: Probeer dedicated search endpoint
    const searchEndpoints = [
      `/users/search?q=${encodeURIComponent(query.trim())}`,
      `/api/users/search?q=${encodeURIComponent(query.trim())}`,
      `/users/search?name=${encodeURIComponent(query.trim())}`,
      `/api/users/search?name=${encodeURIComponent(query.trim())}`,
      `/users/search?email=${encodeURIComponent(query.trim())}`,
      `/api/users/search?email=${encodeURIComponent(query.trim())}`,
    ];
    
    try {
      const res = await withAutoRefresh(searchEndpoints, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (res.ok) {
        const text = await res.text();
        if (!text) return [];
        
        const data = JSON.parse(text);
        console.log('[searchUsers] Search response:', data);
        
        // Handle verschillende response formaten
        if (Array.isArray(data)) {
          return data;
        } else if (data.users && Array.isArray(data.users)) {
          return data.users;
        } else if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.results && Array.isArray(data.results)) {
          return data.results;
        }
        
        return [];
      }
      
      // Check voor 503 Service Unavailable
      if (res.status === 503) {
        throw new Error('De zoekservice is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.');
      }
      
      if (res.status === 404) {
        logMissingSearchEndpointOnce();
      } else {
        const errorMsg = await parseErrorMessage(res);
        console.log('[searchUsers] Search endpoint returned error:', res.status, errorMsg);
      }
    } catch (searchErr: any) {
      // Als het een 503 error is, gooi die door
      if (searchErr?.message?.includes('503') || searchErr?.message?.includes('niet beschikbaar')) {
        throw searchErr;
      }
      if (String(searchErr?.message || '').includes('404')) {
        logMissingSearchEndpointOnce();
      }
      console.log('[searchUsers] Search endpoint not available or failed:', searchErr?.message);
      // Continue naar strategie 2
    }
    
    // Strategie 2: Haal alle gebruikers op en filter client-side
    console.log('[searchUsers] Trying to fetch all users and filter client-side');
    
    const listEndpoints = [
      '/users',
      '/api/users',
      '/users/all',
      '/api/users/all',
      '/users/list',
      '/api/users/list'
    ];
    
    const listRes = await withAutoRefresh(listEndpoints, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (listRes.ok) {
      const text = await listRes.text();
      if (!text) return [];
      
      let allUsers;
      try {
        const parsed = JSON.parse(text);
        // Handle verschillende response formaten
        if (Array.isArray(parsed)) {
          allUsers = parsed;
        } else if (parsed.users && Array.isArray(parsed.users)) {
          allUsers = parsed.users;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          allUsers = parsed.data;
        } else {
          console.log('[searchUsers] Unexpected response format:', parsed);
          return [];
        }
      } catch (parseErr) {
        console.error('[searchUsers] Failed to parse response:', parseErr);
        return [];
      }
      
      console.log('[searchUsers] Got', allUsers.length, 'users, filtering...');
      
      // Filter client-side op first_name, last_name, email, job_function, sector
      const filtered = allUsers.filter((user: UserModel) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const firstName = (user.first_name || '').toLowerCase();
        const lastName = (user.last_name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const jobFunction = (user.job_function || '').toLowerCase();
        const sector = (user.sector || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               firstName.includes(searchTerm) || 
               lastName.includes(searchTerm) ||
               email.includes(searchTerm) ||
               jobFunction.includes(searchTerm) ||
               sector.includes(searchTerm);
      });
      
      console.log('[searchUsers] Filtered to', filtered.length, 'matching users');
      return filtered;
    }
    
    // Check voor 503 errors
    if (listRes.status === 503) {
      throw new Error('De gebruikersservice is tijdelijk overbelast. Probeer het over een paar minuten opnieuw.');
    }
    
    // Als list endpoint ook niet werkt
    const listError = await parseErrorMessage(listRes);
    console.error('[searchUsers] List endpoint also failed:', listRes.status, listError);
    
    if (listRes.status >= 500) {
      throw new Error('De server heeft problemen. Probeer het later opnieuw.');
    }
    
    throw new Error(`Kon gebruikers niet ophalen (status ${listRes.status})`);
    
  } catch (err: any) {
    console.error('[searchUsers] All strategies failed:', err);
    // Geef specifieke foutmelding voor 503
    if (err?.message?.includes('503') || err?.message?.includes('overbelast') || err?.message?.includes('niet beschikbaar')) {
      throw err;
    }
    throw new Error(err?.message || 'Zoeken mislukt. De server is mogelijk tijdelijk niet bereikbaar.');
  }
}

export async function fetchConversation(withUserId: number): Promise<ChatMessage[]> {
  if (!Number.isFinite(withUserId)) {
    throw new Error("Ongeldig gebruikers-id om mee te chatten.");
  }
  try {
    const res = await withAutoRefresh(
      [`/chat/messages?with=${encodeURIComponent(withUserId)}`],
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

export async function fetchAllMyMessages(): Promise<ChatMessage[]> {
  try {
    const res = await withAutoRefresh(
      ["/chat/messages"],
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
      CHAT_BASE_URLS,
    );
    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        // Sommige implementaties vereisen `with`; in dat geval tonen we een lege lijst
        return [];
      }
      throw new Error(await parseErrorMessage(res));
    }
    const text = await res.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (err: any) {
    // Als de server een 400 terugstuurt omdat `with` ontbreekt, behandel dat als "geen berichten".
    const message = err?.message?.toLowerCase?.() || "";
    if (message.includes("400") || message.includes("with")) {
      return [];
    }
    throw new Error(normalizeNetworkError(err));
  }
}

export async function sendChatMessage(payload: SendMessageRequest): Promise<ChatMessage> {
  if (!payload?.content || !payload.receiver_id) {
    throw new Error("Bericht en ontvanger zijn verplicht.");
  }
  try {
    const res = await withAutoRefresh(
      ["/chat/send"],
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      CHAT_BASE_URLS,
    );
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    return await res.json();
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
