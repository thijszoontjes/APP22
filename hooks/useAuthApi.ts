import { BASE_URLS, CHAT_BASE_URLS } from "../constants/api";
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
  id?: number;
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
    // probeer refresh
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

export async function getUserInterests(): Promise<UserInterestsInput> {
  try {
    const res = await withAutoRefresh(
      ["/api/users/me/interests", "/users/me/interests"],
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
    return await res.json();
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
}

export async function updateUserInterests(payload: UserInterestsInput): Promise<UserInterestsInput> {
  try {
    const sanitizedPayload: UserInterestsInput = {};

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        sanitizedPayload[key] = value;
      }
    });

    // Zorg dat afstand in alle mogelijke sleutelvarianten meegestuurd wordt
    if (sanitizedPayload.distance_km !== undefined) {
      sanitizedPayload.distance = sanitizedPayload.distance_km;
    }
    if (sanitizedPayload.max_distance_km !== undefined) {
      sanitizedPayload.max_distance = sanitizedPayload.max_distance_km;
    }
    const interestArray = Array.isArray(payload.interests) ? payload.interests : [];
    const interestFlags = Object.entries(payload)
      .filter(([key, value]) => typeof value === "boolean" && value === true)
      .map(([key]) => key);
    const mergedInterests = Array.from(new Set([...interestArray, ...interestFlags]));
    if (mergedInterests.length) {
      sanitizedPayload.interests = mergedInterests;
      sanitizedPayload.categories = mergedInterests;
    }

    const res = await withAutoRefresh(
      ["/api/users/me/interests", "/users/me/interests"],
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedPayload),
      },
    );
    if (!res.ok) {
      if (res.status >= 500) {
        throw new Error("Server tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      throw new Error(await parseErrorMessage(res));
    }
    // Sommige backends geven 204 No Content terug op een geslaagde update.
    if (res.status === 204) {
      return sanitizedPayload;
    }
    const text = await res.text();
    if (!text) return sanitizedPayload;
    try {
      return JSON.parse(text);
    } catch {
      return sanitizedPayload;
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
