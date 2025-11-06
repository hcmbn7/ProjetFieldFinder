import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminCreateField,
  adminDeleteField,
  adminUpdateField,
  fetchAdminProfile,
  loginAdmin,
  type FieldPayload,
} from "../api/admin";
import { fetchFields } from "../api/fields";
import { boroughs, formatOptions, surfaceTypes } from "../data";
import type { Admin, SoccerField } from "../types";

const ADMIN_STORAGE_KEY = "fieldfinderAdmin";
const ADMIN_TOKEN_STORAGE_KEY = "fieldfinderAdminToken";

type FieldFormMode = "create" | "edit";

interface FieldFormState {
  id?: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  surface_type: string;
  format: string;
  borough: string;
  lighting: boolean;
  parking: boolean;
  accessibility: boolean;
  phone: string;
  website: string;
  description: string;
  amenities: string;
  photos: string;
}

const emptyForm: FieldFormState = {
  id: undefined,
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  surface_type: "",
  format: "",
  borough: "",
  lighting: false,
  parking: false,
  accessibility: false,
  phone: "",
  website: "",
  description: "",
  amenities: "",
  photos: "",
};

const BOROUGH_OPTIONS = ["", ...new Set([...boroughs, "Autre"])];

const FORMAT_OPTIONS = ["", ...new Set([...formatOptions, "Autre"])];

const SURFACE_OPTIONS = ["", ...new Set([...surfaceTypes, "Autre"])];

function toList(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}

function buildFieldPayload(state: FieldFormState): FieldPayload {
  const latitude = Number(state.latitude);
  const longitude = Number(state.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Veuillez fournir une latitude et une longitude valides.");
  }

  const payload: FieldPayload = {
    name: state.name.trim(),
    address: state.address.trim(),
    coordinates: [latitude, longitude],
    surface_type: state.surface_type.trim() || undefined,
    format: state.format.trim() || undefined,
    lighting: state.lighting,
    parking: state.parking,
    accessibility: state.accessibility,
    phone: state.phone.trim() || undefined,
    website: state.website.trim() || undefined,
    borough: state.borough.trim() || undefined,
    description: state.description.trim() || undefined,
  amenities: toList(state.amenities),
  photos: toList(state.photos),
  };

  return payload;
}

function hydrateForm(field: SoccerField): FieldFormState {
  return {
    id: field.id,
    name: field.name,
    address: field.address,
    latitude: String(field.coordinates?.[0] ?? ""),
    longitude: String(field.coordinates?.[1] ?? ""),
    surface_type: field.surface_type ?? "",
    format: field.format ?? "",
    borough: field.borough ?? "",
    lighting: Boolean(field.lighting),
    parking: Boolean(field.parking),
    accessibility: Boolean(field.accessibility),
    phone: field.phone ?? "",
    website: field.website ?? "",
    description: field.description ?? "",
    amenities: Array.isArray(field.amenities) ? field.amenities.join(", ") : "",
    photos: Array.isArray(field.photos) ? field.photos.join(", ") : "",
  };
}

export default function AdminDashboard() {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [fields, setFields] = useState<SoccerField[]>([]);
  const [formState, setFormState] = useState<FieldFormState>(emptyForm);
  const [formMode, setFormMode] = useState<FieldFormMode>("create");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSaving, setLoginSaving] = useState(false);

  const loadFields = useCallback(async () => {
    try {
      const data = await fetchFields();
      setFields(data);
    } catch (error) {
      console.error("Impossible de charger les terrains", error);
    }
  }, []);

  const persistAdminSession = useCallback((admin: Admin, token: string) => {
    setCurrentAdmin(admin);
    setAuthToken(token);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  }, []);

  const clearAdminSession = useCallback(() => {
    setCurrentAdmin(null);
    setAuthToken(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
    const storedToken = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

    if (!storedAdmin || !storedToken) {
      clearAdminSession();
      return;
    }

    try {
      JSON.parse(storedAdmin);
      setLoadingProfile(true);
      fetchAdminProfile(storedToken)
        .then((profile) => {
          persistAdminSession(profile, storedToken);
        })
        .catch((error) => {
          console.error("Impossible de valider la session administrateur", error);
          clearAdminSession();
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    } catch {
      clearAdminSession();
    }
  }, [clearAdminSession, persistAdminSession]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const handleLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      if (!email || !password) {
        setLoginError("Veuillez fournir un courriel et un mot de passe.");
        return;
      }

      setLoginError(null);
      setLoginSaving(true);

      try {
        const { admin, token } = await loginAdmin({ email, password });
        persistAdminSession(admin, token);
      } catch (error) {
        setLoginError(
          error instanceof Error
            ? error.message
            : "Connexion administrateur impossible"
        );
      } finally {
        setLoginSaving(false);
      }
    },
    [persistAdminSession]
  );

  const handleLogout = useCallback(() => {
    clearAdminSession();
  }, [clearAdminSession]);

  const resetForm = useCallback(() => {
    setFormState(emptyForm);
    setFormMode("create");
    setFormError(null);
  }, []);

  const handleEditField = useCallback((field: SoccerField) => {
    setFormState(hydrateForm(field));
    setFormMode("edit");
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteField = useCallback(
    async (field: SoccerField) => {
      if (!authToken) {
        setFormError("Authentification administrateur requise.");
        return;
      }
      const confirmation = window.confirm(
        `Voulez-vous vraiment supprimer le terrain "${field.name}" ?`
      );
      if (!confirmation) {
        return;
      }
      try {
        await adminDeleteField(field.id, authToken);
        await loadFields();
        if (formState.id === field.id) {
          resetForm();
        }
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Échec de la suppression du terrain"
        );
      }
    },
    [authToken, formState.id, loadFields, resetForm]
  );

  const handleFieldSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!authToken) {
        setFormError("Authentification administrateur requise.");
        return;
      }

      if (!formState.name.trim() || !formState.address.trim()) {
        setFormError("Le nom et l'adresse du terrain sont requis.");
        return;
      }

      try {
        setFormError(null);
        setFormSaving(true);
        const payload = buildFieldPayload(formState);

        if (formMode === "edit" && formState.id) {
          await adminUpdateField(formState.id, payload, authToken);
        } else {
          await adminCreateField(payload, authToken);
        }

        await loadFields();
        resetForm();
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "Échec de l'enregistrement du terrain"
        );
      } finally {
        setFormSaving(false);
      }
    },
    [authToken, formMode, formState, loadFields, resetForm]
  );

  const totalFields = useMemo(() => fields.length, [fields]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-8 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="uppercase tracking-[0.4em] text-xs text-emerald-200 font-semibold mb-2">
              Espace administrateur
            </p>
            <h1 className="text-3xl font-bold">Gestion des terrains</h1>
          </div>
          {currentAdmin ? (
            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-emerald-200/80">Connecté en tant que</p>
                <p className="text-lg font-semibold text-white">{currentAdmin.full_name}</p>
                <p className="text-xs text-emerald-100/70">{currentAdmin.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="text-right space-y-2">
              <p className="text-sm text-emerald-200/80">Veuillez vous connecter</p>
              <p className="text-xs text-emerald-100/70">
                Accès réservé aux administrateurs enregistrés.
              </p>
            </div>
          )}
        </header>

        {!currentAdmin ? (
          <section className="bg-white rounded-3xl shadow-2xl border border-emerald-100/60 p-10 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-emerald-900 mb-6">
              Connexion administrateur
            </h2>
            {loginError && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-emerald-800" htmlFor="admin-email">
                  Courriel
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="admin@fieldfinder.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-emerald-800" htmlFor="admin-password">
                  Mot de passe
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Votre mot de passe"
                />
              </div>
              <button
                type="submit"
                disabled={loginSaving || loadingProfile}
                className="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 shadow-md hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {loginSaving || loadingProfile ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
              >
                Retour à l'accueil
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="bg-white rounded-3xl shadow-2xl border border-emerald-100/60 p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-emerald-900">
                    {formMode === "edit" ? "Modifier un terrain" : "Ajouter un nouveau terrain"}
                  </h2>
                  <p className="text-sm text-emerald-700/80">
                    {formMode === "edit"
                      ? "Actualisez les informations puis enregistrez vos modifications."
                      : "Renseignez les informations principales pour créer un terrain."}
                  </p>
                </div>
                {formMode === "edit" && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                  >
                    Ajouter un nouveau terrain
                  </button>
                )}
              </div>

              {formError && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFieldSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-name">
                    Nom du terrain *
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-emerald-800"
                    htmlFor="field-address"
                  >
                    Adresse *
                  </label>
                  <input
                    id="field-address"
                    type="text"
                    value={formState.address}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, address: event.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-latitude">
                    Latitude *
                  </label>
                  <input
                    id="field-latitude"
                    type="text"
                    value={formState.latitude}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, latitude: event.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-longitude">
                    Longitude *
                  </label>
                  <input
                    id="field-longitude"
                    type="text"
                    value={formState.longitude}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, longitude: event.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-borough">
                    Quartier / Ville
                  </label>
                  <select
                    id="field-borough"
                    value={formState.borough}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, borough: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    {BOROUGH_OPTIONS.map((option) => (
                      <option key={option || "empty"} value={option}>
                        {option || "Sélectionner"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-format">
                    Format
                  </label>
                  <select
                    id="field-format"
                    value={formState.format}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, format: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    {FORMAT_OPTIONS.map((option) => (
                      <option key={option || "empty"} value={option}>
                        {option || "Sélectionner"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-emerald-800"
                    htmlFor="field-surface_type"
                  >
                    Type de surface
                  </label>
                  <select
                    id="field-surface_type"
                    value={formState.surface_type}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, surface_type: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    {SURFACE_OPTIONS.map((option) => (
                      <option key={option || "empty"} value={option}>
                        {option || "Sélectionner"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-phone">
                    Téléphone
                  </label>
                  <input
                    id="field-phone"
                    type="text"
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-website">
                    Site web
                  </label>
                  <input
                    id="field-website"
                    type="url"
                    value={formState.website}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, website: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label
                    className="text-sm font-semibold text-emerald-800"
                    htmlFor="field-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="field-description"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={formState.lighting}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, lighting: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Éclairage</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={formState.parking}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, parking: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Stationnement</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={formState.accessibility}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          accessibility: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Accessible</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-amenities">
                    Commodités (séparées par des virgules)
                  </label>
                  <input
                    id="field-amenities"
                    type="text"
                    value={formState.amenities}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, amenities: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-800" htmlFor="field-photos">
                    Photos (URLs séparées par des virgules)
                  </label>
                  <input
                    id="field-photos"
                    type="text"
                    value={formState.photos}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, photos: event.target.value }))
                    }
                    className="w-full rounded-xl border border-emerald-200/80 bg-white px-4 py-3 text-emerald-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4">
                  {formMode === "edit" && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {formSaving
                      ? "Enregistrement..."
                      : formMode === "edit"
                      ? "Mettre à jour le terrain"
                      : "Ajouter le terrain"}
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white rounded-3xl shadow-2xl border border-emerald-100/60 p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-emerald-900">
                    Terrains existants
                  </h2>
                  <p className="text-sm text-emerald-700/80">
                    {totalFields} terrain{totalFields > 1 ? "s" : ""} dans la base de données.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadFields}
                  className="px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                >
                  Actualiser la liste
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100">
                  <thead>
                    <tr className="bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Nom</th>
                      <th className="px-4 py-3">Quartier</th>
                      <th className="px-4 py-3 hidden md:table-cell">Adresse</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {fields.map((field) => (
                      <tr key={field.id} className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-900">
                          #{field.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-800 font-medium">
                          {field.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-700">
                          {field.borough || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-600 hidden md:table-cell">
                          {field.address}
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditField(field)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {fields.length === 0 && (
                  <div className="text-center py-12 text-emerald-600/70">
                    Aucun terrain pour le moment.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
