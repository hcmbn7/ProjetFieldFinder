import { useState, useEffect } from 'react';
import { MapPin, List, Search } from 'lucide-react';
import MapComponent from './components/MapComponent';
import FieldCard from './components/FieldCard';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import { SoccerField, MapFilters } from './types';
import { filterFields } from './utils';

function App() {
  const [selectedField, setSelectedField] = useState<SoccerField | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [fields, setFields] = useState<SoccerField[]>([]);
  const [filters, setFilters] = useState<MapFilters>({
    type: 'All',
    size: 'All',
    lighting: null,
    parking: null,
    accessibility: null,
    borough: 'All Boroughs'
  });

  const filteredFields = filterFields(fields, filters, searchTerm);

  useEffect(() => {
    document.title = 'FieldFinder';

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/fields');
        const data = await res.json();
        console.log('DATA FROM API:', data);


        const parsedFields = data.map((field: any) => ({
          id: field.id,
          name: field.name,
          address: field.address,
          coordinates: field.coordinates,
          type: field.surface_type,
          surface_type: field.surface_type || '',
          format: field.format,
          size: field.format || '',
          lighting: field.lighting,
          parking: field.parking,
          accessibility: field.accessibility,
          phone: field.phone ? [field.phone] : [],
          website: field.website || '',
          photos: field.photos?.length ? field.photos : ["/Images/placeholder.jpeg"],
          borough: field.borough || '',
          description: field.description || '',
          amenities: field.amenities || [],
          rating: field.rating || 0,
          reviews: field.reviews || 0
        }));

        setFields(parsedFields);
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      }
    };

    fetchData();
  }, []);



  const handleFieldClick = (field: SoccerField) => {
    setSelectedField(field);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'All',
      size: 'All',
      lighting: null,
      parking: null,
      accessibility: null,
      borough: 'All Boroughs'
    });
  };

  const handleCloseCard = () => {
    setSelectedField(null);
  };

  useEffect(() => {
    document.title = 'FieldFinder';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg">
                <img src="\Images\logo_nobackground.png" alt="logo" className="w-16 h-16 object-cover rounded-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                  FieldFinder
                </h1>
                <p className="text-sm text-emerald-600/80 font-medium">Discover soccer fields in the Greater Montreal area</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-emerald-50/80 rounded-2xl p-1.5 border border-emerald-200/50">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'map'
                      ? 'bg-white text-emerald-700 shadow-md border border-emerald-200'
                      : 'text-emerald-600/70 hover:text-emerald-700 hover:bg-white/50'
                    }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Carte</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'list'
                      ? 'bg-white text-emerald-700 shadow-md border border-emerald-200'
                      : 'text-emerald-600/70 hover:text-emerald-700 hover:bg-white/50'
                    }`}
                >
                  <List className="h-4 w-4" />
                  <span>Liste</span>
                </button>
              </div>
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

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
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
    </div>
  );
}

export default App;