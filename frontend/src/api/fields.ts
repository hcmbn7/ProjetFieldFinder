export interface Field {
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

const API_URL = "http://127.0.0.1:8000/api/fields";

export async function fetchFields(): Promise<Field[]> {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("Failed to fetch fields");
  }
  return res.json();
}
