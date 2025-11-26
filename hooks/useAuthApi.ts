import { BASE_URL } from "../constants/api";

export async function loginApi(email: string, password: string) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Login failed");
    }
    return await res.json(); // Should match keycloak.TokenResponse
  } catch (err: any) {
    throw new Error(err.message || "Network error");
  }
}

export interface RegisterPayload {
  biography: string;
  country: string;
  email: string;
  first_name: string;
  is_blocked: boolean;
  job_function: string;
  keycloak_id: string;
  last_name: string;
  password: string;
  phone_number: string;
  sector: string;
}

export async function registerApi(payload: RegisterPayload) {
  try {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Registration failed");
    }
    return await res.json(); // Should match models.User
  } catch (err: any) {
    throw new Error(err.message || "Network error");
  }
}
