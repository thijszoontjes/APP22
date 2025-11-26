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

export async function loginApi(payload: LoginRequest): Promise<TokenResponse> {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
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
      throw new Error(await parseErrorMessage(res));
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(err?.message || "Network error");
  }
}

export async function registerApi(payload: RegisterPayload): Promise<UserModel> {
  try {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(err?.message || "Network error");
  }
}
