export interface SoccerField {
  id: number;
  name: string;
  address: string;
  coordinates: [number, number];
  type: 'Natural' | 'Artificial' | 'Indoor';
  surface: string;
  size: 'Full' | 'Half' | '7v7' | '5v5';
  lighting: boolean;
  parking: boolean;
  accessibility: boolean;
  phone?: string;
  website?: string;
  image?: string;
  borough?: string;
  description?: string;
  amenities: string[];
  rating: number;
  reviews: number;
}

export interface MapFilters {
  type: string;
  size: string;
  lighting: boolean | null;
  parking: boolean | null;
  accessibility: boolean | null;
  borough: string;
}