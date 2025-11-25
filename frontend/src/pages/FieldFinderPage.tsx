import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, List, MapPin, Search, Send, Sparkles, Star, Trash2, User as UserIcon, LogOut, PlusCircle, Shield } from "lucide-react";
import MapComponent from "../components/MapComponent";
import FieldCard from "../components/FieldCard";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import { fetchFields } from "../api/fields";
import {
  addUserFavorite,
  fetchUserFavorites,
  removeUserFavorite,
} from "../api/users";
import {
  deleteReview as deleteReviewApi,
  fetchReviews,
  upsertReview,
} from "../api/reviews";
import { submitSuggestion } from "../api/suggestions";
import type { MapFilters, Review, SoccerField, User } from "../types";
import { filterFields } from "../utils";

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

const areFavoriteListsEqual = (a: number[], b: number[]) => {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
};

const persistUserToStorage = (user: User | null) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Failed to persist user to storage:", error);
  }
};

const FEATURED_FIELD_IDS = [1, 2, 3];

function FieldFinderPage() {
  const [selectedField, setSelectedField] = useState<SoccerField | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [fields, setFields] = useState<SoccerField[]>([]);
  const [filters, setFilters] = useState<MapFilters>({
    type: "All",
    size: "All",
    lighting: null,
    parking: null,
    accessibility: null,
    borough: "All Boroughs",
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored) as User;
      if (parsed && Array.isArray(parsed.favorites)) {
        return {
          ...parsed,
          favorites: sanitizeFavoriteIds(parsed.favorites),
        };
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [favorites, setFavorites] = useState<number[]>(() =>
    currentUser?.favorites ? sanitizeFavoriteIds(currentUser.favorites) : []
  );
  const [favoritePendingIds, setFavoritePendingIds] = useState<number[]>([]);
  const [showOnlyFavoritesOnMap, setShowOnlyFavoritesOnMap] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareFieldIds, setCompareFieldIds] = useState<[number | null, number | null]>([
    null,
    null,
  ]);
  const [compareSelectionTarget, setCompareSelectionTarget] = useState<0 | 1 | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const favoritesSectionRef = useRef<HTMLDivElement | null>(null);
  const showcaseSectionRef = useRef<HTMLDivElement | null>(null);
  const compareSectionRef = useRef<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    description: "",
    contact: "",
  });
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
  const [fieldReviews, setFieldReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ rating: number; comment: string }>({
    rating: 0,
    comment: "",
  });

  const applyReviewAggregates = useCallback(
    (fieldId: number, reviews: Review[]) => {
      const total = reviews.length;
      const average = total
        ? Number(
            (
              reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
              total
            ).toFixed(2)
          )
        : undefined;

      setFields((prev) =>
        prev.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                rating: average,
                reviews: total,
              }
            : field
        )
      );

      setSelectedField((prev) =>
        prev && prev.id === fieldId
          ? {
              ...prev,
              rating: average,
              reviews: total,
            }
          : prev
      );
    },
    []
  );

  const currentUserReview = useMemo(() => {
    if (!currentUser) {
      return null;
    }
    return fieldReviews.find((review) => review.user_id === currentUser.id) ?? null;
  }, [currentUser, fieldReviews]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        try {
          const parsed = event.newValue
            ? (JSON.parse(event.newValue) as User)
            : null;
          if (parsed) {
            const sanitized = sanitizeFavoriteIds(parsed.favorites ?? []);
            setCurrentUser({ ...parsed, favorites: sanitized });
            setFavorites(sanitized);
          } else {
            setCurrentUser(null);
            setFavorites([]);
          }
        } catch {
          setCurrentUser(null);
          setFavorites([]);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    document.title = "FieldFinder";
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setFavorites([]);
      return;
    }

    let isCancelled = false;

    const loadFavorites = async () => {
      try {
        const remoteFavorites = await fetchUserFavorites(currentUser.id);
        if (isCancelled) {
          return;
        }
        const sanitized = sanitizeFavoriteIds(remoteFavorites);
        setFavorites(sanitized);

        let updatedUser: User | null = null;
        setCurrentUser((prev) => {
          if (!prev || prev.id !== currentUser.id) {
            return prev;
          }
          const prevFavorites = sanitizeFavoriteIds(prev.favorites ?? []);
          if (areFavoriteListsEqual(prevFavorites, sanitized)) {
            return prev;
          }
          updatedUser = { ...prev, favorites: sanitized };
          return updatedUser;
        });
        if (updatedUser) {
          persistUserToStorage(updatedUser);
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
    };

    loadFavorites();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const data = await fetchFields();
        const enriched = data.map((field) => {
          // Ignore any pre-computed/fake rating counts coming from the field record.
          // Ratings are only derived from real reviews fetched separately.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { rating: _rating, reviews: _reviews, ...rest } = field;
          const coordinates =
            Array.isArray(field.coordinates) && field.coordinates.length === 2
              ? [Number(field.coordinates[0]), Number(field.coordinates[1])] as [number, number]
              : ([45.5017, -73.5673] as [number, number]);

          return {
            ...rest,
            rating: undefined,
            reviews: undefined,
            coordinates,
            photos:
              Array.isArray(field.photos) && field.photos.length > 0
                ? field.photos
                : ["/Images/placeholder.jpeg"],
          };
        });
        setFields(enriched);
      } catch (error) {
        console.error("Failed to fetch fields:", error);
      }
    };

    loadFields();
  }, []);

  useEffect(() => {
    if (!selectedField) {
      setFieldReviews([]);
      setReviewForm({ rating: 0, comment: "" });
      setReviewError(null);
      setReviewLoading(false);
      return;
    }

    let isCancelled = false;
    setReviewLoading(true);
    setReviewError(null);

    fetchReviews(selectedField.id)
      .then((data) => {
        if (isCancelled) {
          return;
        }
        setFieldReviews(data);
        applyReviewAggregates(selectedField.id, data);
        const existing = currentUser
          ? data.find((review) => review.user_id === currentUser.id)
          : null;
        setReviewForm({
          rating: existing?.rating ?? 0,
          comment: existing?.comment ?? "",
        });
      })
      .catch((error) => {
        if (!isCancelled) {
          setReviewError(
            error instanceof Error
              ? error.message
              : "Impossible de charger les avis"
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setReviewLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedField?.id, currentUser?.id, applyReviewAggregates]);

  const filteredFields = useMemo(
    () => filterFields(fields, filters, searchTerm),
    [fields, filters, searchTerm]
  );

  const favoriteFields = useMemo(
    () =>
      favorites
        .map((id) => fields.find((field) => field.id === id))
        .filter((field): field is SoccerField => Boolean(field)),
    [favorites, fields]
  );

  const showcaseFields = useMemo(() => {
    const selected = FEATURED_FIELD_IDS
      .map((id) => fields.find((field) => field.id === id))
      .filter((field): field is SoccerField => Boolean(field));

    if (selected.length === FEATURED_FIELD_IDS.length) {
      return selected;
    }

    const fallbackPool = fields.filter(
      (field) => !FEATURED_FIELD_IDS.includes(field.id)
    );

    return [...selected, ...fallbackPool].slice(0, FEATURED_FIELD_IDS.length);
  }, [fields]);

  const handleFieldClick = (field: SoccerField) => {
    if (compareSelectionTarget !== null) {
      setCompareFieldIds((prev) => {
        const next: [number | null, number | null] = [...prev];
        next[compareSelectionTarget] = field.id;
        return next;
      });
      setCompareSelectionTarget(null);
      setShowCompare(true);
      setSelectedField(field);
      compareSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }
    setSelectedField(field);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleClearFilters = () => {
    setFilters({
      type: "All",
      size: "All",
      lighting: null,
      parking: null,
      accessibility: null,
      borough: "All Boroughs",
    });
  };

  const handleCloseCard = () => {
    setSelectedField(null);
  };

  const handleSaveReview = async () => {
    if (!currentUser || !selectedField) {
      return;
    }
    if (reviewForm.rating < 1) {
      setReviewError("Merci de choisir une note avant d'envoyer votre avis.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const saved = await upsertReview(selectedField.id, currentUser.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || null,
      });

      setFieldReviews((prev) => {
        const existingIndex = prev.findIndex(
          (review) =>
            review.user_id === saved.user_id &&
            review.field_id === saved.field_id
        );
        const next = [...prev];
        if (existingIndex >= 0) {
          next[existingIndex] = saved;
        } else {
          next.unshift(saved);
        }
        applyReviewAggregates(selectedField.id, next);
        return next;
      });
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer votre avis."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentUser || !selectedField) {
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);

    try {
      await deleteReviewApi(selectedField.id, currentUser.id);
      setFieldReviews((prev) => {
        const next = prev.filter(
          (review) => review.user_id !== currentUser.id
        );
        applyReviewAggregates(selectedField.id, next);
        return next;
      });
      setReviewForm({ rating: 0, comment: "" });
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer votre avis."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleToggleFavorite = async (fieldId: number) => {
    if (!currentUser) {
      return;
    }
    if (favoritePendingIds.includes(fieldId)) {
      return;
    }

    const userId = currentUser.id;
    const isFavorite = favorites.includes(fieldId);

    setFavoritePendingIds((prev) =>
      prev.includes(fieldId) ? prev : [...prev, fieldId]
    );

    try {
      const updatedUser = isFavorite
        ? await removeUserFavorite(userId, fieldId)
        : await addUserFavorite(userId, fieldId);

      if (!updatedUser || updatedUser.id !== userId) {
        return;
      }

      const sanitized = sanitizeFavoriteIds(updatedUser.favorites ?? []);
      setFavorites(sanitized);
      const userWithFavorites: User = { ...updatedUser, favorites: sanitized };
      setCurrentUser(userWithFavorites);
      persistUserToStorage(userWithFavorites);
    } catch (error) {
      console.error("Failed to update favorites:", error);
    } finally {
      setFavoritePendingIds((prev) => prev.filter((id) => id !== fieldId));
    }
  };

  const handleShowFavorites = () => {
    if (!currentUser) {
      return;
    }
    favoritesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShowcaseScroll = () => {
    showcaseSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShowcaseClick = (field: SoccerField) => {
    setViewMode("map");
    setSelectedField(field);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = () => {
    persistUserToStorage(null);
    setCurrentUser(null);
    setFavorites([]);
    setFavoritePendingIds([]);
    setShowOnlyFavoritesOnMap(false);
    setShowCompare(false);
    setCompareFieldIds([null, null]);
    setCompareSelectionTarget(null);
    setShowSuggestions(false);
  };

  const formatDisplayName = (value?: string) => {
    if (!value) return "";
    return value
      .trim()
      .split(/\s+/)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(" ");
  };

  const userDisplayName =
    formatDisplayName(currentUser?.full_name) || currentUser?.email || "";

  const userInitials = useMemo(() => {
    const source = formatDisplayName(currentUser?.full_name) || currentUser?.email || "";
    if (!source) return "FF";
    const parts = source.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [currentUser?.email, currentUser?.full_name]);

  const mapFields = useMemo(() => {
    if (!showOnlyFavoritesOnMap) {
      return filteredFields;
    }
    return filteredFields.filter((field) => favorites.includes(field.id));
  }, [favorites, filteredFields, showOnlyFavoritesOnMap]);

  useEffect(() => {
    if (
      selectedField &&
      !mapFields.some((field) => field.id === selectedField.id)
    ) {
      setSelectedField(null);
    }
  }, [mapFields, selectedField]);

  const visibleFieldCount =
    viewMode === "map" && showOnlyFavoritesOnMap
      ? mapFields.length
      : filteredFields.length;

  useEffect(() => {
    if (!showCompare) {
      setCompareSelectionTarget(null);
      return;
    }
    const available = filteredFields.slice(0, 2).map((field) => field.id);
    setCompareFieldIds((prev) => [
      prev[0] ?? available[0] ?? null,
      prev[1] ?? available[1] ?? null,
    ]);
  }, [filteredFields, showCompare]);

  const handleCompareSelect = (slotIndex: 0 | 1, value: string) => {
    const numeric = Number(value) || null;
    setCompareFieldIds((prev) => {
      const next: [number | null, number | null] = [...prev];
      next[slotIndex] = numeric;
      return next;
    });
  };

  const comparedFields: (SoccerField | null)[] = compareFieldIds.map((id) =>
    id ? filteredFields.find((field) => field.id === id) ?? null : null
  );

  const handleSubmitSuggestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = suggestionForm.name.trim();
    const trimmedAddress = suggestionForm.address.trim();
    if (!trimmedName || !trimmedAddress) {
      setSuggestionMessage("Veuillez fournir au minimum un nom et une adresse.");
      return;
    }
    const latitude = Number(suggestionForm.latitude);
    const longitude = Number(suggestionForm.longitude);
    const payload = {
      name: trimmedName,
      address: trimmedAddress,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      description: suggestionForm.description.trim() || undefined,
      contact: suggestionForm.contact.trim() || undefined,
    };
    submitSuggestion(payload)
      .then(() => {
        setSuggestionForm({
          name: "",
          address: "",
          latitude: "",
          longitude: "",
          description: "",
          contact: "",
        });
        setSuggestionMessage("Merci ! Votre suggestion a été envoyée aux administrateurs.");
      })
      .catch((error) => {
        setSuggestionMessage(
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer votre suggestion pour le moment."
        );
      });
  };


  return (
    <div className="min-h-screen bg-emerald-50 font-sans text-slate-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 shadow-sm group-hover:shadow-md transition-all duration-300 border border-emerald-100">
                <img
                  src="/Images/logo_nobackground.png"
                  alt="logo"
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-bold text-emerald-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                  FieldFinder
                </h1>
                <p className="hidden md:block text-xs text-slate-500 font-medium">
                  Terrains de sport du Grand Montréal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              {showcaseFields.length > 0 && (
                <button
                  type="button"
                  onClick={handleShowcaseScroll}
                  className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>À la une</span>
                </button>
              )}

              {currentUser && (
                 <button
                    type="button"
                    onClick={handleShowFavorites}
                    className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-colors"
                 >
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>Mes Favoris</span>
                 </button>
              )}

              <div className="h-6 w-px bg-slate-200 hidden lg:block" />

              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 pl-2 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                      {userInitials}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">
                      {userDisplayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/profile"
                      className="p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-2"
                      title="Mon Profil"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden md:inline">Profil</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions((prev) => !prev)}
                      className="p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-2"
                      title="Proposer un terrain"
                    >
                       <PlusCircle className="w-4 h-4" />
                       <span className="hidden md:inline">Proposer</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Déconnexion"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all"
                  >
                    Inscription
                  </Link>
                  <Link
                    to="/admin"
                     className="hidden sm:inline-flex p-2 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                     title="Accès Admin"
                  >
                    <Shield className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-40 py-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-2 pointer-events-auto flex flex-col lg:flex-row gap-3 items-center">
             <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
                <FilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    isOpen={showFilters}
                    onToggle={() => setShowFilters(!showFilters)}
                    onClear={handleClearFilters}
                />
                <button
                  type="button"
                  onClick={() => setShowCompare((prev) => !prev)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    showCompare
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Comparer</span>
                </button>
             </div>

             <div className="w-px h-8 bg-slate-200 hidden lg:block" />

             <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onClear={handleClearSearch}
                />
             </div>

             <div className="w-px h-8 bg-slate-200 hidden lg:block" />

             <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                   <button
                      onClick={() => setViewMode("map")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                         viewMode === "map"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                      }`}
                   >
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">Carte</span>
                   </button>
                   <button
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                         viewMode === "list"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                      }`}
                   >
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">Liste</span>
                   </button>
                </div>

                {currentUser && (
                   <div className="flex items-center gap-2">
                     <button
                        onClick={() => setShowOnlyFavoritesOnMap(prev => !prev)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                           showOnlyFavoritesOnMap
                              ? "bg-red-50 border-red-200 text-red-600"
                              : "bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                        }`}
                        title={showOnlyFavoritesOnMap ? "Afficher tous" : "Afficher favoris uniquement"}
                     >
                        <Heart className="w-5 h-5" fill={showOnlyFavoritesOnMap ? "currentColor" : "none"} />
                     </button>
                   </div>
                )}
             </div>
          </div>
          <div className="mt-2 px-2 flex justify-end">
               <span className="text-xs font-medium text-slate-500 bg-white/80 backdrop-blur px-2 py-1 rounded-full shadow-sm border border-slate-100">
                  {visibleFieldCount} terrain{visibleFieldCount !== 1 ? 's' : ''} trouvé{visibleFieldCount !== 1 ? 's' : ''}
               </span>
          </div>
        </div>
      </div>

      <main ref={mapSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {showCompare && (
          <section className="animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">Comparateur</h3>
                     <p className="text-sm text-slate-500">Sélectionnez deux terrains pour comparer leurs caractéristiques.</p>
                  </div>
                  <button onClick={() => setShowCompare(false)} className="text-sm text-slate-500 hover:text-slate-700 font-medium">Fermer</button>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8" ref={compareSectionRef}>
                  {[0, 1].map((slot) => (
                     <div key={slot} className="flex flex-col gap-4">
                        <div className="flex gap-2">
                           <select
                              value={compareFieldIds[slot] ?? ""}
                              onChange={(e) => handleCompareSelect(slot as 0 | 1, e.target.value)}
                              className="flex-1 rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                           >
                              <option value="">Sélectionner un terrain...</option>
                              {filteredFields.map((f) => (
                                 <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                           </select>
                           <button
                              onClick={() => {
                                 setCompareSelectionTarget(slot as 0 | 1);
                                 setViewMode("map");
                                 mapCanvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className={`px-3 rounded-xl border ${compareSelectionTarget === slot ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                           >
                              <MapPin className="w-4 h-4" />
                           </button>
                        </div>
                        {comparedFields[slot] ? (
                           <FieldCard
                              field={comparedFields[slot]!}
                              onToggleFavorite={currentUser ? handleToggleFavorite : undefined}
                              isFavorite={favorites.includes(comparedFields[slot]!.id)}
                              disableFavorite={favoritePendingIds.includes(comparedFields[slot]!.id)}
                           />
                        ) : (
                           <div className="h-64 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                              <List className="w-8 h-8 mb-2 opacity-50" />
                              <span className="text-sm font-medium">Emplacement vide</span>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
          </section>
        )}

        {showSuggestions && (
           <section className="animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-xl overflow-hidden text-white p-8">
                 <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3 space-y-4">
                       <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                          <Send className="w-6 h-6" />
                       </div>
                       <h3 className="text-2xl font-bold">Proposez un terrain</h3>
                       <p className="text-emerald-100 leading-relaxed">
                          Vous connaissez un terrain qui n'est pas sur la carte ? Aidez la communauté en partageant ses informations.
                       </p>
                    </div>
                    <div className="md:w-2/3 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        {suggestionMessage ? (
                           <div className="h-full flex items-center justify-center text-center p-8">
                              <p className="text-lg font-semibold">{suggestionMessage}</p>
                           </div>
                        ) : (
                           <form onSubmit={handleSubmitSuggestion} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input
                                 value={suggestionForm.name}
                                 onChange={(e) => setSuggestionForm({ ...suggestionForm, name: e.target.value })}
                                 placeholder="Nom du terrain *"
                                 className="bg-black/20 border-transparent text-white placeholder-emerald-200/70 rounded-lg focus:bg-black/30 focus:ring-white focus:border-transparent"
                              />
                              <input
                                 value={suggestionForm.address}
                                 onChange={(e) => setSuggestionForm({ ...suggestionForm, address: e.target.value })}
                                 placeholder="Adresse *"
                                 className="bg-black/20 border-transparent text-white placeholder-emerald-200/70 rounded-lg focus:bg-black/30 focus:ring-white focus:border-transparent"
                              />
                              <input
                                 value={suggestionForm.latitude}
                                 onChange={(e) => setSuggestionForm({ ...suggestionForm, latitude: e.target.value })}
                                 placeholder="Latitude"
                                 className="bg-black/20 border-transparent text-white placeholder-emerald-200/70 rounded-lg focus:bg-black/30 focus:ring-white focus:border-transparent"
                              />
                              <input
                                 value={suggestionForm.longitude}
                                 onChange={(e) => setSuggestionForm({ ...suggestionForm, longitude: e.target.value })}
                                 placeholder="Longitude"
                                 className="bg-black/20 border-transparent text-white placeholder-emerald-200/70 rounded-lg focus:bg-black/30 focus:ring-white focus:border-transparent"
                              />
                              <textarea
                                 value={suggestionForm.description}
                                 onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })}
                                 placeholder="Description..."
                                 rows={3}
                                 className="sm:col-span-2 bg-black/20 border-transparent text-white placeholder-emerald-200/70 rounded-lg focus:bg-black/30 focus:ring-white focus:border-transparent"
                              />
                              <input
                                 value={suggestionForm.contact}
                                 onChange={(e) => setSuggestionForm({ ...suggestionForm, contact: e.target.value })}
                                 placeholder="Contact (courriel/téléphone)"
                                 className="sm:col-span-2 bg-black/20 border-transparent text-white placeholder-emerald-200/70 rounded-lg focus:bg-black/30 focus:ring-white focus:border-transparent"
                              />
                              <div className="sm:col-span-2 flex justify-end">
                                 <button type="submit" className="px-6 py-2 bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-colors">
                                    Envoyer
                                 </button>
                              </div>
                           </form>
                        )}
                    </div>
                 </div>
              </div>
           </section>
        )}

        <section>
            {viewMode === 'map' ? (
               <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group">
                     <div ref={mapCanvasRef} className="h-[500px] lg:h-[700px] w-full bg-slate-100 relative z-0">
                        <MapComponent
                           fields={mapFields}
                           onFieldClick={handleFieldClick}
                           selectedField={selectedField ?? undefined}
                           favoriteIds={favorites}
                        />
                     </div>
                     {showcaseFields.length > 0 && (
                       <button
                         onClick={handleShowcaseScroll}
                         className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur text-xs font-bold text-emerald-700 px-3 py-1.5 rounded-lg shadow-sm border border-emerald-100 hover:bg-white transition-all flex items-center gap-1"
                       >
                         <Sparkles className="w-3 h-3" /> A la une
                       </button>
                     )}
                  </div>

                  {selectedField && (
                     <div className="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-40 animate-in slide-in-from-right-8 duration-300 z-10">
                        <FieldCard
                           field={selectedField}
                           onClose={handleCloseCard}
                           onToggleFavorite={currentUser ? handleToggleFavorite : undefined}
                           isFavorite={favorites.includes(selectedField.id)}
                           disableFavorite={favoritePendingIds.includes(selectedField.id)}
                        />
                        <div className="mt-4 bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                                Notes & avis
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star
                                  className="w-5 h-5 text-amber-400"
                                  fill="currentColor"
                                />
                                <span className="text-lg font-bold text-slate-800">
                                  {selectedField.rating ?? "—"}
                                </span>
                                <span className="text-sm text-slate-500">
                                  {selectedField.reviews ?? 0} avis
                                </span>
                              </div>
                            </div>
                            {currentUserReview && (
                              <button
                                onClick={handleDeleteReview}
                                disabled={reviewSubmitting}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Supprimer</span>
                              </button>
                            )}
                          </div>

                          {reviewError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              {reviewError}
                            </div>
                          )}

                          <div className="space-y-3">
                            {currentUser ? (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">
                                    Votre note
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                          setReviewForm((prev) => ({
                                            ...prev,
                                            rating: value,
                                          }))
                                        }
                                        className="p-1 rounded-lg hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                      >
                                        <Star
                                          className="w-5 h-5"
                                          strokeWidth={reviewForm.rating >= value ? 2.5 : 2}
                                          fill={
                                            reviewForm.rating >= value
                                              ? "#fbbf24"
                                              : "none"
                                          }
                                          color={reviewForm.rating >= value ? "#d97706" : undefined}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                  <span className="text-sm text-slate-500">
                                    {reviewForm.rating ? `${reviewForm.rating}/5` : "Choisissez une note"}
                                  </span>
                                </div>
                                <textarea
                                  value={reviewForm.comment}
                                  onChange={(e) =>
                                    setReviewForm((prev) => ({
                                      ...prev,
                                      comment: e.target.value,
                                    }))
                                  }
                                  placeholder="Partagez votre experience (facultatif)"
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-200 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-700"
                                />
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={handleSaveReview}
                                    disabled={reviewSubmitting}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    {reviewSubmitting ? "Envoi..." : "Enregistrer mon avis"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-slate-600">
                                Connectez-vous pour laisser un avis sur ce terrain.
                              </p>
                            )}
                          </div>

                          <div className="border-t border-slate-200 pt-3">
                            <h4 className="text-sm font-semibold text-slate-800 mb-2">
                              Avis des joueurs
                            </h4>
                            {reviewLoading ? (
                              <p className="text-sm text-slate-500">Chargement des avis...</p>
                            ) : fieldReviews.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                Aucun avis pour l'instant. Soyez le premier !
                              </p>
                            ) : (
                              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {fieldReviews.map((review) => (
                                  <div
                                    key={review.id}
                                    className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                          {[1, 2, 3, 4, 5].map((value) => (
                                            <Star
                                              key={value}
                                              className="w-4 h-4"
                                              fill={review.rating >= value ? "#fbbf24" : "none"}
                                              color={review.rating >= value ? "#d97706" : "#d1d5db"}
                                              strokeWidth={review.rating >= value ? 2.5 : 2}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-slate-500">
                                          {review.user_name || `Utilisateur #${review.user_id}`}
                                        </span>
                                      </div>
                                      <span className="text-xs text-slate-400">
                                        {new Date(review.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {review.comment ? (
                                      <p className="text-sm text-slate-700 mt-2">{review.comment}</p>
                                    ) : (
                                      <p className="text-xs text-slate-500 mt-2">Pas de commentaire.</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                     </div>
                  )}
               </div>
            ) : (
               // Grid View
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFields.length > 0 ? (
                     filteredFields.map(field => (
                        <div key={field.id} className="h-full">
                           <FieldCard
                              field={field}
                              onClose={() => {}}
                              onToggleFavorite={currentUser ? handleToggleFavorite : undefined}
                              isFavorite={favorites.includes(field.id)}
                              disableFavorite={favoritePendingIds.includes(field.id)}
                           />
                        </div>
                     ))
                  ) : (
                     <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <MapPin className="w-12 h-12 mb-4 text-emerald-200" />
                        <h3 className="text-lg font-semibold text-slate-600">Aucun terrain trouvé</h3>
                        <p>Essayez de modifier vos filtres ou votre recherche.</p>
                        <button onClick={handleClearFilters} className="mt-4 text-emerald-600 font-medium hover:underline">
                           Réinitialiser les filtres
                        </button>
                     </div>
                  )}
               </div>
            )}
        </section>

        {currentUser && (
           <section ref={favoritesSectionRef} className="space-y-6 pt-8 border-t border-slate-200">
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                        Vos favoris
                     </h2>
                     <p className="text-slate-500 mt-1">Retrouvez vos terrains préférés en un clic.</p>
                  </div>
                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                     {favoriteFields.length}
                  </span>
               </div>
               
               {favoriteFields.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {favoriteFields.map((field) => (
                        <div key={field.id} onClick={() => handleFieldClick(field)} className="cursor-pointer">
                           <FieldCard
                              field={field}
                              onToggleFavorite={handleToggleFavorite}
                              isFavorite={true}
                              disableFavorite={favoritePendingIds.includes(field.id)}
                           />
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                     <p className="text-slate-500">Vous n'avez pas encore de favoris.</p>
                     <button 
                        onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-2 text-emerald-600 font-medium hover:underline"
                     >
                        Parcourir la carte
                     </button>
                  </div>
               )}
           </section>
        )}

        {showcaseFields.length > 0 && (
           <section ref={showcaseSectionRef} className="space-y-6 pt-8 border-t border-slate-200 pb-12">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                     <span className="text-emerald-600 font-bold tracking-wider text-xs uppercase mb-1 block">Sélection du mois</span>
                     <h2 className="text-2xl font-bold text-slate-800">Terrains à la une</h2>
                  </div>
                  <Link to="/signup" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
                     Voir tous les terrains <span aria-hidden="true">→</span>
                  </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {showcaseFields.map((field) => (
                     <button
                        key={field.id}
                        onClick={() => handleShowcaseClick(field)}
                        className="group text-left bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
                     >
                        <div className="relative h-48 overflow-hidden">
                           <img 
                              src={field.photos?.[0] || "/Images/placeholder.jpeg"} 
                              alt={field.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                           <div className="absolute bottom-4 left-4 text-white">
                              <h3 className="font-bold text-lg leading-tight">{field.name}</h3>
                              <p className="text-sm text-slate-200 flex items-center gap-1 mt-1">
                                 <MapPin className="w-3 h-3" /> {field.borough || 'Montréal'}
                              </p>
                           </div>
                           <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-2 py-1 rounded-lg">
                              {field.format || 'Standard'}
                           </div>
                        </div>
                        <div className="p-4">
                           <p className="text-sm text-slate-600 line-clamp-2 mb-3">{field.description || "Aucune description disponible pour ce terrain."}</p>
                           <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                              <span className="px-2 py-1 bg-emerald-50 rounded-md">{field.surface_type || "Surface inconnue"}</span>
                              {field.lighting && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md">Éclairé</span>}
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
           </section>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 mb-6">
               <img src="/Images/logo_nobackground.png" alt="logo" className="w-8 h-8 object-contain" />
            </div>
            <p className="text-slate-500 text-sm">© 2025 FieldFinder.</p>
         </div>
      </footer>
    </div>
  );
}

export default FieldFinderPage;
