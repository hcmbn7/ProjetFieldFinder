import { SoccerField, MapFilters } from './types';

export const filterFields = (fields: SoccerField[], filters: MapFilters, searchTerm: string): SoccerField[] => {
  return fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.borough.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.type === 'All' || field.type === filters.type;
    const matchesSize = filters.size === 'All' || field.size === filters.size;
    const matchesLighting = filters.lighting === null || field.lighting === filters.lighting;
    const matchesParking = filters.parking === null || field.parking === filters.parking;
    const matchesAccessibility = filters.accessibility === null || field.accessibility === filters.accessibility;
    const matchesBorough = filters.borough === 'All Boroughs' || field.borough === filters.borough;
    
    return matchesSearch && matchesType && matchesSize && matchesLighting && 
           matchesParking && matchesAccessibility && matchesBorough;
  });
};

export const getFieldIcon = (type: string): string => {
  switch (type) {
    case 'Natural':
      return '🌱';
    case 'Artificial':
      return '🏟️';
    case 'Indoor':
      return '🏢';
    default:
      return '⚽';
  }
};

export const formatRating = (rating: number): string => {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
};