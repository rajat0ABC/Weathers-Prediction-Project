import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, Sparkles, Navigation } from 'lucide-react';
import { CityInfo } from '../types';
import { INDIAN_CITIES, searchCitiesLocally } from '../data/cities';

interface SearchBarSectionProps {
  onSearch: (cityName: string) => void;
  onSelectCity: (city: CityInfo) => void;
  onUseLocation: () => void;
  currentCity: CityInfo;
}

const POPULAR_QUICK_CITIES = [
  { id: 'indore', name: 'Indore' },
  { id: 'bhopal', name: 'Bhopal' },
  { id: 'jaipur', name: 'Jaipur' },
  { id: 'delhi', name: 'Delhi' },
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'bengaluru', name: 'Bengaluru' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'kolkata', name: 'Kolkata' },
  { id: 'chennai', name: 'Chennai' },
];

export const SearchBarSection: React.FC<SearchBarSectionProps> = ({
  onSearch,
  onSelectCity,
  onUseLocation,
  currentCity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<CityInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autocomplete updates
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const results = searchCitiesLocally(searchTerm.trim());
      setSuggestions(results.slice(0, 6));
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      onSearch(query);
      setShowDropdown(false);
    }
  };

  const handleSelectSuggestion = (city: CityInfo) => {
    setSearchTerm(city.name);
    setShowDropdown(false);
    onSelectCity(city);
  };

  const handleQuickCityClick = (cityId: string) => {
    const found = INDIAN_CITIES.find(c => c.id === cityId);
    if (found) {
      setSearchTerm(found.name);
      onSelectCity(found);
    } else {
      onSearch(cityId);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3.5 transition-colors">
        
        {/* Search Bar Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 pointer-events-none" />
            <input
              id="main-city-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (searchTerm.trim().length > 1) setShowDropdown(true); }}
              placeholder="Search city e.g. Indore, Hyderabad, Jaipur, Bengaluru, Mumbai..."
              className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            id="main-city-search-btn"
            className="px-5 sm:px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-2xl shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>

          {/* GPS Location Button */}
          <button
            type="button"
            onClick={onUseLocation}
            title="Locate weather at current coordinates"
            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-500 rounded-2xl border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-200">
              My GPS
            </span>
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 sm:left-5 sm:right-5 top-20 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in duration-100 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40">
              Matching Indian Cities & Observatories
            </div>
            {suggestions.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelectSuggestion(city)}
                className="w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <span className="font-semibold">{city.name}</span>
                  <span className="text-xs text-slate-400">({city.state})</span>
                </div>
                <span className="text-xs text-slate-400 italic truncate max-w-[150px]">
                  {city.landmark}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Quick-Pick Popular City Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Pick:
          </span>
          {POPULAR_QUICK_CITIES.map((c) => {
            const isActive = currentCity.id === c.id || currentCity.name.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleQuickCityClick(c.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
