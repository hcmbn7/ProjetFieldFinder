import React from 'react';
import { Sliders } from 'lucide-react';
import { MapFilters } from '../types';
import { boroughs } from '../data.ts';

interface FilterPanelProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  isOpen,
  onToggle,
  onClear
}) => {
  const updateFilter = (key: keyof MapFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.type !== 'All' || filters.size !== 'All' || 
    filters.lighting !== null || filters.parking !== null || 
    filters.accessibility !== null || filters.borough !== 'All Boroughs';

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center space-x-3 px-6 py-3 rounded-2xl border transition-all duration-200 shadow-sm ${
          hasActiveFilters 
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200' 
            : 'bg-white/90 backdrop-blur-sm border-emerald-200/50 text-emerald-700 hover:bg-emerald-50/80'
        }`}
      >
        <Sliders className="h-5 w-5" />
        <span className="font-semibold">Filters</span>
        {hasActiveFilters && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 bg-white/95 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-xl p-6 w-80 z-[1000]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-emerald-700">Filtrer les Terrains</h3>
            <button
              onClick={onClear}
              className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors font-semibold px-3 py-1 rounded-lg hover:bg-emerald-50/50"
            >
              Effacer
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-2">Type de Terrain</label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-full p-3 border border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 bg-white/80 text-emerald-900"
              >
                <option value="All">Tout les Types</option>
                <option value="Natural">Naturel</option>
                <option value="Artificial">Artificiel</option>
                <option value="Indoor">Intérieur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-2">Taille de Terrain</label>
              <select
                value={filters.size}
                onChange={(e) => updateFilter('size', e.target.value)}
                className="w-full p-3 border border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 bg-white/80 text-emerald-900"
              >
                <option value="All">Toutes les Tailles</option>
                <option value="5v5">5v5</option>
                <option value="7v7">7v7</option>
                <option value="11v11">11v11</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-2">Quartier/Ville</label>
              <select
                value={filters.borough}
                onChange={(e) => updateFilter('borough', e.target.value)}
                className="w-full p-3 border border-emerald-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300 bg-white/80 text-emerald-900"
              >
                {boroughs.map(borough => (
                  <option key={borough} value={borough}>{borough}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-emerald-700">Commodités</label>
              
              <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.lighting === true}
                  onChange={(e) => updateFilter('lighting', e.target.checked ? true : null)}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500/50 w-4 h-4"
                />
                <span className="text-sm text-emerald-700 font-medium">Éclairage Disponible</span>
              </label>

              <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.parking === true}
                  onChange={(e) => updateFilter('parking', e.target.checked ? true : null)}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500/50 w-4 h-4"
                />
                <span className="text-sm text-emerald-700 font-medium">Stationnement Disponible</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;