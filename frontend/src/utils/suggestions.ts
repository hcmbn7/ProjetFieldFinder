import type { FieldSuggestion } from "../types";

const STORAGE_KEY = "fieldfinderSuggestions";

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

export function loadSuggestions(): FieldSuggestion[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSuggestions(suggestions: FieldSuggestion[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
}

export function addSuggestion(suggestion: FieldSuggestion): FieldSuggestion[] {
  const next = [...loadSuggestions(), suggestion];
  saveSuggestions(next);
  return next;
}

export function updateSuggestion(updated: FieldSuggestion): FieldSuggestion[] {
  const suggestions = loadSuggestions().map((item) =>
    item.id === updated.id ? { ...item, ...updated } : item
  );
  saveSuggestions(suggestions);
  return suggestions;
}

export function deleteSuggestion(id: string): FieldSuggestion[] {
  const suggestions = loadSuggestions().filter((item) => item.id !== id);
  saveSuggestions(suggestions);
  return suggestions;
}
