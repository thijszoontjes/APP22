import { BASE_URL } from "../constants/api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
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
    if (!text) return "Er is iets misgegaan";
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

const authHeaders = (token: string) => {
  if (!token) {
    throw new Error("Geen sessie gevonden. Log opnieuw in.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export async function loginApi(payload: LoginRequest): Promise<TokenResponse> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
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
    const res = await fetchWithTimeout(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

export async function getUserInterests(token: string): Promise<UserInterestsInput> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/users/me/interests`, {
      method: "GET",
      headers: authHeaders(token),
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

export async function updateUserInterests(token: string, payload: UserInterestsInput): Promise<UserInterestsInput> {
  try {
    const sanitizedPayload: UserInterestsInput = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        sanitizedPayload[key] = value;
      }
    });
    const res = await fetchWithTimeout(`${BASE_URL}/users/me/interests`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(sanitizedPayload),
    });
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
