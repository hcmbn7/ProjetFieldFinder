import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { List, MapPin, Search } from "lucide-react";
import MapComponent from "../components/MapComponent";
import FieldCard from "../components/FieldCard";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import { fetchFields } from "../api/fields";
import type { MapFilters, SoccerField, User } from "../types";
import { filterFields } from "../utils";

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
      const stored = localStorage.getItem("fieldfinderUser");
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "fieldfinderUser") {
        try {
          setCurrentUser(event.newValue ? JSON.parse(event.newValue) : null);
        } catch {
          setCurrentUser(null);
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
    const loadFields = async () => {
      try {
        const data = await fetchFields();
        const enriched = data.map((field) => {
          const coordinates =
            Array.isArray(field.coordinates) && field.coordinates.length === 2
              ? [Number(field.coordinates[0]), Number(field.coordinates[1])] as [number, number]
              : ([45.5017, -73.5673] as [number, number]);

          return {
            ...field,
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

  const filteredFields = useMemo(
    () => filterFields(fields, filters, searchTerm),
    [fields, filters, searchTerm]
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

  const handleShowcaseClick = (field: SoccerField) => {
    setViewMode("map");
    setSelectedField(field);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = () => {
    localStorage.removeItem("fieldfinderUser");
    setCurrentUser(null);
  };

  const userDisplayName =
    currentUser?.full_name?.trim() || currentUser?.email || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg">
                <img
                  src="/Images/logo_nobackground.png"
                  alt="logo"
                  className="w-16 h-16 object-cover rounded-2xl"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                  FieldFinder
                </h1>
                <p className="text-sm text-emerald-600/80 font-medium">
                  Découvrez les terrains de soccer dans le Grand Montréal
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-emerald-50/80 rounded-2xl p-1.5 border border-emerald-200/50">
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    viewMode === "map"
                      ? "bg-white text-emerald-700 shadow-md border border-emerald-200"
                      : "text-emerald-600/70 hover:text-emerald-700 hover:bg-white/50"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Carte</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white text-emerald-700 shadow-md border border-emerald-200"
                      : "text-emerald-600/70 hover:text-emerald-700 hover:bg-white/50"
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span>Liste</span>
                </button>
              </div>
              {currentUser ? (
                <div className="flex items-center space-x-4 ml-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">
                      Connecté
                    </p>
                    <p className="text-sm font-semibold text-emerald-700">
                      {userDisplayName}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-3">
                  <Link
                    to="/login"
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 border-b border-emerald-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-3xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-emerald-500" />
                </div>
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onClear={handleClearSearch}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
                onClear={handleClearFilters}
              />
              <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl border border-emerald-200/50 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-emerald-700">
                    {filteredFields.length} terrains trouvés
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={mapSectionRef} className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-12">
        <div>
          {viewMode === 'map' ? (
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100/50 overflow-hidden">
                  <div className="h-[650px] relative">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-200/50 shadow-sm">
                        <span className="text-xs font-semibold text-emerald-700">Interactive Map</span>
                      </div>
                    </div>
                    <MapComponent
                      fields={filteredFields}
                      onFieldClick={handleFieldClick}
                      selectedField={selectedField ?? undefined}
                    />
                  </div>
                </div>
              </div>

              {selectedField && (
                <div className="w-96 flex-shrink-0">
                  <div className="sticky top-8">
                    <FieldCard field={selectedField} onClose={handleCloseCard} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFields.map(field => (
                  <div key={field.id} className="cursor-pointer transform hover:scale-105 transition-all duration-200">
                    <FieldCard field={field} onClose={() => { }} />
                  </div>
                ))}
              </div>
              {filteredFields.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-emerald-300 text-8xl mb-6">⚽</div>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-3">Aucun terrain trouvé</h3>
                </div>
              )}
            </div>
          )}
        </div>

        {showcaseFields.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100/60 p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 font-semibold mb-2">
                  Sélection spéciale
                </p>
                <h2 className="text-3xl font-bold text-emerald-800">
                  Top Terrains du moment
                </h2>
                <p className="text-sm text-emerald-600/80 mt-2 max-w-xl">
                  Trois terrains coups de coeur à découvrir ce mois-ci.
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-2 text-emerald-600 bg-emerald-50/80 px-4 py-2 rounded-full border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold">
                  Mises à jour chaque visite
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {showcaseFields.map((field) => {
                const coverPhoto = field.photos?.[0] ?? "/Images/placeholder.jpeg";
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => handleShowcaseClick(field)}
                    className="group w-full text-left bg-white rounded-2xl border border-emerald-100/60 overflow-hidden shadow-sm hover:shadow-emerald-100/60 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={coverPhoto}
                        alt={field.name}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 bg-emerald-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                        Coup de coeur
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-800 mb-1">
                          {field.name}
                        </h3>
                        <p className="text-sm text-emerald-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                          {field.borough || field.address}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-semibold">
                          Format&nbsp;
                          <span className="font-normal text-emerald-600">
                            {field.format || "—"}
                          </span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-semibold">
                          Surface&nbsp;
                          <span className="font-normal text-emerald-600">
                            {field.surface_type || "—"}
                          </span>
                        </div>
                      </div>
                      {field.description && (
                        <p className="text-sm text-emerald-600/80 leading-relaxed">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldFinderPage;
