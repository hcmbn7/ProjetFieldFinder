export interface SoccerField {
  id: number;
  name: string;
  address: string;
  coordinates: [number, number];
  hidden?: boolean;
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
  featured?: boolean;
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
  favorites?: number[];
}

export interface Admin {
  id: number;
  email: string;
  full_name: string;
}

export interface FieldSuggestion {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  contact?: string;
  borough?: string;
  surface_type?: string;
  format?: string;
  created_at?: string;
  status?: string;
  published_field_id?: number | null;
}

export interface Review {
  id: number;
  user_id: number;
  field_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  updated_at?: string | null;
  user_name?: string | null;
}

export interface ReviewCreate {
  rating: number;
  comment?: string | null;
}

export interface GameParticipant {
  user_id: number;
  role: string;
  status: string;
  joined_at: string;
}

export interface Game {
  id: number;
  title: string;
  field_id: number;
  organizer_id: number;
  start_at: string;
  duration_minutes: number;
  max_players: number;
  skill_level?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  participants: GameParticipant[];
}
