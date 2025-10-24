import React from 'react';
import { X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, onClear }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Chercher par nom de terrain ou quartier/ville..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-emerald-200/50 bg-white/80 text-gray-600 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-300"
      />
      {searchTerm && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-emerald-600 transition-colors"
        >
          <div className="p-1 rounded-full hover:bg-emerald-100/50 transition-colors">
            <X className="h-5 w-5 text-emerald-500" />
          </div>
        </button>
      )}
    </div>
  );
};

export default SearchBar;