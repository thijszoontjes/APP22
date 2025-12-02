import { BASE_URL } from "../constants/api";
import { clearAuthToken, getAuthTokens, saveAuthTokens } from "./authStorage";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  refresh_expires_in?: number;
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
  distance_km?: number;
  max_distance_km?: number;
  [key: string]: boolean | number | undefined;
}

const REQUEST_TIMEOUT_MS = 12000;

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
    return `Kan geen verbinding maken met de server (${BASE_URL}). Controleer je internetverbinding of probeer het later opnieuw.`;
  }
  return message || "Network error";
};

const requestWithFallback = async (
  paths: string[],
  init: RequestInit,
): Promise<Response> => {
  let lastRes: Response | null = null;
  for (const path of paths) {
    const url = `${BASE_URL}${path}`;
    const res = await fetchWithTimeout(url, init);
    lastRes = res;
    if (res.status !== 404) {
      return res;
    }
  }
  if (lastRes) {
    throw new Error(`Endpoint niet gevonden (404) op ${BASE_URL}. Controleer EXPO_PUBLIC_API_URL.`);
  }
  throw new Error("Onbekende fout: geen respons van de server.");
};

const refreshApi = async (refresh_token: string): Promise<TokenResponse> => {
  if (!refresh_token) {
    throw new Error("Geen refresh token beschikbaar; log opnieuw in.");
  }
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      throw new Error(await parseErrorMessage(res));
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(normalizeNetworkError(err));
  }
};

const withAutoRefresh = async (paths: string[], options: RequestInit = {}): Promise<Response> => {
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
    });

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
      ["/auth/login", "/api/auth/login"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Account niet gevonden of wachtwoord onjuist");
      }
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

export async function registerApi(payload: RegisterPayload): Promise<UserModel> {
  try {
    // Stuur alleen ingevulde velden mee; laat keycloak_id weg als die niet is meegegeven om duplicate key issues te voorkomen.
    const requestBody: Partial<RegisterPayload> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        // @ts-ignore - dynamisch samenstellen
        requestBody[key] = value;
      }
    });
    if (!requestBody.keycloak_id) {
      // voorkom duplicate constraint op lege keycloak_id door een unieke fallback te zetten
      requestBody.keycloak_id = `app-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    }
    const res = await requestWithFallback(
      ["/users/register", "/api/users/register"],
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    return await res.json();
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
    });
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
    if (sanitizedPayload.distance_km !== undefined) {
      sanitizedPayload.distance = sanitizedPayload.distance_km;
    }
    const res = await withAutoRefresh(
      ["/users/me/interests", "/api/users/me/interests"],
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
