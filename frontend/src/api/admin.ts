import type { Admin, SoccerField } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const ADMIN_LOGIN_ENDPOINT = `${API_BASE_URL}/admin/login`;
const ADMIN_ME_ENDPOINT = `${API_BASE_URL}/admin/me`;
const FIELDS_ENDPOINT = `${API_BASE_URL}/fields`;

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface FieldPayload {
  name: string;
  address: string;
  coordinates: [number, number];
  surface_type?: string;
  format?: string;
  lighting?: boolean;
  parking?: boolean;
  accessibility?: boolean;
  phone?: string;
  website?: string;
  borough?: string;
  description?: string;
  amenities?: string[];
  rating?: number;
  reviews?: number;
  photos?: string[];
}

function buildAuthHeader(token: string) {
  return {
    Authorization: token,
    "Content-Type": "application/json",
  };
}

function encodeBasicToken(email: string, password: string): string {
  if (typeof window === "undefined") {
    throw new Error("Admin authentication encoding requires a browser environment");
  }
  const raw = `${email}:${password}`;
  return `Basic ${window.btoa(raw)}`;
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
    console.error("Failed to parse admin error response", error);
  }
  return res.statusText || "Une erreur est survenue";
}

export async function loginAdmin(
  credentials: AdminCredentials
): Promise<{ admin: Admin; token: string }> {
  const res = await fetch(ADMIN_LOGIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const admin = (await res.json()) as Admin;
  const token = encodeBasicToken(credentials.email, credentials.password);
  return { admin, token };
}

export async function fetchAdminProfile(token: string): Promise<Admin> {
  const res = await fetch(ADMIN_ME_ENDPOINT, {
    method: "GET",
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function adminCreateField(
  payload: FieldPayload,
  token: string
): Promise<SoccerField> {
  const res = await fetch(FIELDS_ENDPOINT, {
    method: "POST",
    headers: buildAuthHeader(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function adminUpdateField(
  fieldId: number,
  payload: Partial<FieldPayload>,
  token: string
): Promise<SoccerField> {
  const res = await fetch(`${FIELDS_ENDPOINT}/${fieldId}`, {
    method: "PUT",
    headers: buildAuthHeader(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function adminDeleteField(
  fieldId: number,
  token: string
): Promise<void> {
  const res = await fetch(`${FIELDS_ENDPOINT}/${fieldId}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}

export function decodeAdminToken(token: string): AdminCredentials | null {
  if (!token.startsWith("Basic ")) {
    return null;
  }
  try {
    const base64 = token.replace(/^Basic\s+/i, "");
    if (typeof window === "undefined") {
      throw new Error("Admin authentication decoding requires a browser environment");
    }
    const decoded = window.atob(base64);
    const [email, password] = decoded.split(":", 2);
    if (!email || typeof password === "undefined") {
      return null;
    }
    return { email, password };
  } catch {
    return null;
  }
}
