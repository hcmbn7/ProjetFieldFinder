import type { SoccerField, MapFilters } from "./types";

export const filterFields = (
  fields: SoccerField[],
  filters: MapFilters,
  searchTerm: string
): SoccerField[] => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return fields.filter((field) => {
    const name = field.name?.toLowerCase() ?? "";
    const address = field.address?.toLowerCase() ?? "";
    const borough = field.borough?.toLowerCase() ?? "";

    const matchesSearch =
      normalizedSearch.length === 0 ||
      name.includes(normalizedSearch) ||
      address.includes(normalizedSearch) ||
      borough.includes(normalizedSearch);

    const surfaceType = field.surface_type ?? "";
    const format = field.format ?? "";
    const matchesType =
      filters.type === "All" || surfaceType === filters.type;
    const matchesSize = filters.size === "All" || format === filters.size;
    const matchesLighting =
      filters.lighting === null ||
      Boolean(field.lighting) === Boolean(filters.lighting);
    const matchesParking =
      filters.parking === null ||
      Boolean(field.parking) === Boolean(filters.parking);
    const matchesAccessibility =
      filters.accessibility === null ||
      Boolean(field.accessibility) === Boolean(filters.accessibility);
    const matchesBorough =
      filters.borough === "All Boroughs" || borough === filters.borough.toLowerCase();

    return (
      matchesSearch &&
      matchesType &&
      matchesSize &&
      matchesLighting &&
      matchesParking &&
      matchesAccessibility &&
      matchesBorough
    );
  });
};

export const getFieldIcon = (type: string): string => {
  switch (type) {
    case "Natural":
      return "🌱";
    case "Artificial":
      return "🏟️";
    case "Indoor":
      return "🏢";
    default:
      return "⚽";
  }
};

export const formatRating = (rating: number = 0): string => {
  const rounded = Math.max(0, Math.min(5, Math.floor(rating)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
};
