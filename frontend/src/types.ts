export interface SoccerField {
  id: number;
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

export interface MapFilters {
  type: string;
  size: string;
  lighting: boolean | null;
  parking: boolean | null;
  accessibility: boolean | null;
  borough: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active?: boolean;
}
