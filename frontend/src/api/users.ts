import type { User } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const USERS_ENDPOINT = `${API_BASE_URL}/users`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/users/login`;
const FAVORITES_ENDPOINT = (userId: number) =>
  `${USERS_ENDPOINT}/${userId}/favorites`;
const FAVORITE_ITEM_ENDPOINT = (userId: number, fieldId: number) =>
  `${USERS_ENDPOINT}/${userId}/favorites/${fieldId}`;

export interface SignupPayload {
  email: string;
  full_name: string;
  password: string;
  is_active?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

async function parseError(res: Response): Promise<string> {
  try {
    const payload = await res.json();
    if (payload?.detail) {
      return payload.detail;
    }
    if (typeof payload === "string") {
      return payload;
    }
  } catch (error) {
    console.error("Failed to parse error response", error);
  }
  return res.statusText || "Une erreur est survenue";
}

export async function signupUser(payload: SignupPayload): Promise<User> {
  const res = await fetch(USERS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function loginUser(payload: LoginPayload): Promise<User> {
  const res = await fetch(LOGIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function fetchUserFavorites(userId: number): Promise<number[]> {
  const res = await fetch(FAVORITES_ENDPOINT(userId));
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const payload = await res.json();
  return Array.isArray(payload) ? payload : [];
}

export async function addUserFavorite(
  userId: number,
  fieldId: number
): Promise<User> {
  const res = await fetch(FAVORITE_ITEM_ENDPOINT(userId, fieldId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function removeUserFavorite(
  userId: number,
  fieldId: number
): Promise<User> {
  const res = await fetch(FAVORITE_ITEM_ENDPOINT(userId, fieldId), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function replaceUserFavorites(
  userId: number,
  favorites: number[]
): Promise<User> {
  const res = await fetch(FAVORITES_ENDPOINT(userId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}
