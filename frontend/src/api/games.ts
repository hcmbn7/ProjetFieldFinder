import type { Game } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const GAMES_ENDPOINT = `${API_BASE_URL}/games`;

export async function fetchGamesByField(fieldId: number): Promise<Game[]> {
  const res = await fetch(`${GAMES_ENDPOINT}?field_id=${fieldId}`);
  if (!res.ok) {
    throw new Error("Impossible de charger les matchs");
  }
  return res.json();
}

export async function fetchGamesUpcoming(): Promise<Game[]> {
  const res = await fetch(GAMES_ENDPOINT);
  if (!res.ok) {
    throw new Error("Impossible de charger les matchs");
  }
  return res.json();
}

export async function fetchGamesHistory(organizerId?: number): Promise<Game[]> {
  const query = organizerId ? `?organizer_id=${organizerId}` : "";
  const res = await fetch(`${GAMES_ENDPOINT}/history${query}`);
  if (!res.ok) {
    const text = await res.text();
    console.error("History request failed", res.status, res.statusText, text);
    throw new Error("Impossible de charger l'historique des matchs.");
  }
  const data = await res.json();
  console.debug("History payload length:", Array.isArray(data) ? data.length : "unknown");
  return data;
}

export interface GamePayload {
  title: string;
  field_id: number;
  organizer_id: number;
  start_at: string;
  duration_minutes: number;
  max_players: number;
  skill_level?: string | null;
  notes?: string | null;
}

export async function createGame(payload: GamePayload): Promise<Game> {
  const res = await fetch(GAMES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Impossible de créer le match");
  }
  return res.json();
}

export async function joinGame(gameId: number, userId: number): Promise<Game> {
  const res = await fetch(`${GAMES_ENDPOINT}/${gameId}/join?user_id=${userId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Impossible de rejoindre le match");
  }
  return res.json();
}

export async function leaveGame(gameId: number, userId: number): Promise<Game> {
  const res = await fetch(`${GAMES_ENDPOINT}/${gameId}/leave?user_id=${userId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Impossible de quitter le match");
  }
  return res.json();
}

export async function cancelGame(gameId: number, userId: number): Promise<Game> {
  const res = await fetch(`${GAMES_ENDPOINT}/${gameId}/cancel?user_id=${userId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Impossible d'annuler le match");
  }
  return res.json();
}
