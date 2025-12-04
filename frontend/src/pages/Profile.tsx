import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateUser } from "../api/users";
import type { User } from "../types";

const USER_STORAGE_KEY = "fieldfinderUser";

const sanitizeFavoriteIds = (values: unknown): number[] => {
  if (!Array.isArray(values)) {
    return [];
  }
  const sanitized = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  return Array.from(new Set(sanitized));
};

const formatDisplayName = (value?: string) => {
  if (!value) return "";
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) {
        navigate("/login", { replace: true });
        return;
      }
      const parsed = JSON.parse(stored) as User | null;
      if (!parsed) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(parsed);
      setFullName(formatDisplayName(parsed.full_name) ?? "");
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const favoriteIds = useMemo(
    () => sanitizeFavoriteIds(user?.favorites ?? []),
    [user?.favorites]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    const formattedName = formatDisplayName(trimmedName);

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateUser(user.id, { full_name: formattedName });
      const nextUser: User = {
        ...user,
        ...updatedUser,
        favorites: sanitizeFavoriteIds(
          updatedUser?.favorites ?? user?.favorites ?? []
        ),
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      setFullName(formatDisplayName(nextUser.full_name));
      setSuccess("Votre nom a été mis à jour.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour votre nom pour le moment."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-lg border border-emerald-100 shadow-2xl rounded-3xl p-8 sm:p-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 mt-2">
              Profil
            </h1>
          </div>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="full-name"
              className="text-sm font-semibold text-emerald-700"
            >
              Nom complet
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={100}
              className="w-full rounded-2xl border border-emerald-200/70 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Votre nom"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-700">
              Adresse courriel
            </p>
            <p className="rounded-2xl border border-emerald-200/50 bg-emerald-50/40 px-4 py-3 text-emerald-900">
              {user.email}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-700">Favoris</p>
            <p className="rounded-2xl border border-emerald-200/50 bg-emerald-50/40 px-4 py-3 text-emerald-900">
              {favoriteIds.length > 0
                ? `${favoriteIds.length} terrain${favoriteIds.length > 1 ? "s" : ""} enregistré${favoriteIds.length > 1 ? "s" : ""}`
                : "Aucun favori enregistré"}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
