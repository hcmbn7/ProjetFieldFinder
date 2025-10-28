import type { SoccerField } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const FIELDS_ENDPOINT = `${API_BASE_URL}/fields`;

export async function fetchFields(): Promise<SoccerField[]> {
  const res = await fetch(FIELDS_ENDPOINT);
  if (!res.ok) {
    throw new Error("Failed to fetch fields");
  }
  return res.json();
}
