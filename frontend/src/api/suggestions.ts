import type { FieldSuggestion } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const SUGGESTIONS_ENDPOINT = `${API_BASE_URL}/field-suggestions`;

async function parseError(res: Response): Promise<string> {
  try {
    const payload = await res.json();
    if (payload?.detail) {
      return payload.detail;
    }
    if (typeof payload === "string") {
      return payload;
    }
  } catch {
    /* ignore */
  }
  return res.statusText || "Une erreur est survenue";
}

export interface SuggestionPayload {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  contact?: string;
  borough?: string;
  surface_type?: string;
  format?: string;
}

export async function submitSuggestion(
  payload: SuggestionPayload
): Promise<FieldSuggestion> {
  const res = await fetch(SUGGESTIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function fetchSuggestions(token: string): Promise<FieldSuggestion[]> {
  const res = await fetch(SUGGESTIONS_ENDPOINT, {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function updateSuggestionApi(
  id: number,
  payload: Partial<SuggestionPayload & { status?: string }>
): Promise<FieldSuggestion> {
  const token = localStorage.getItem("fieldfinderAdminToken") ?? "";
  const res = await fetch(`${SUGGESTIONS_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function deleteSuggestionApi(id: number): Promise<void> {
  const token = localStorage.getItem("fieldfinderAdminToken") ?? "";
  const res = await fetch(`${SUGGESTIONS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}

export async function publishSuggestionApi(
  id: number
): Promise<FieldSuggestion> {
  const token = localStorage.getItem("fieldfinderAdminToken") ?? "";
  const res = await fetch(`${SUGGESTIONS_ENDPOINT}/${id}/publish`, {
    method: "POST",
    headers: { Authorization: token },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}
