import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  RotateCw, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Star, 
  History, 
  CloudSun
} from 'lucide-react';
import { CityInfo, TempUnit, ThemeMode } from '../types';
import { searchCitiesLocally } from '../data/cities';

interface NavbarProps {
  onSearch: (cityName: string) => void;
  onUseLocation: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  unit: TempUnit;
  onToggleUnit: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectCity: (city: CityInfo) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  onUseLocation,
  onRefresh,
  isRefreshing,
  unit,
  onToggleUnit,
  theme,
  onToggleTheme,
  onSelectCity,
  favoritesCount,
  onOpenFavorites,
  onOpenHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<CityInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const results = searchCitiesLocally(searchTerm);
      setSuggestions(results.slice(0, 6));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim();
    if (clean) {
      onSearch(clean);
      setShowSuggestions(false);
      setMobileMenuOpen(false);
    } else {
      // If user clicks search without text, show top Indian cities
      const results = searchCitiesLocally('Indore');
      setSuggestions(results.slice(0, 6));
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (city: CityInfo) => {
    onSelectCity(city);
    setShowSuggestions(false);
    setSearchTerm('');
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo */}
          <div 
            onClick={() => scrollToSection('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
            id="nav-logo"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <CloudSun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-amber-600 dark:from-sky-400 dark:via-indigo-300 dark:to-amber-400 bg-clip-text text-transparent">
                Weather Prediction
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 rounded border border-orange-200 dark:border-orange-800">
                INDIA
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button 
              id="nav-link-home"
              onClick={() => scrollToSection('dashboard')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Home
            </button>
            <button 
              id="nav-link-current"
              onClick={() => scrollToSection('current-weather')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Current Weather
            </button>
            <button 
              id="nav-link-forecast"
              onClick={() => scrollToSection('forecast-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Forecast
            </button>
            <button 
              id="nav-link-prediction"
              onClick={() => scrollToSection('prediction-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Prediction
            </button>
            <button 
              id="nav-link-aqi"
              onClick={() => scrollToSection('aqi-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Air Quality
            </button>
            <button 
              id="nav-link-disasters"
              onClick={() => scrollToSection('disaster-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold transition-colors"
            >
              Safe Routes
            </button>
            <button 
              id="nav-link-charts"
              onClick={() => scrollToSection('charts-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Charts
            </button>
            <button 
              id="nav-link-map"
              onClick={() => scrollToSection('weather-map-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Weather Map
            </button>
            <button 
              id="nav-link-alerts"
              onClick={() => scrollToSection('alerts-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              Alerts
            </button>
            <button 
              id="nav-link-about"
              onClick={() => scrollToSection('about-section')} 
              className="px-2.5 py-1.5 rounded-lg hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              About
            </button>
          </nav>

          {/* Search Box in Header */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm hidden sm:block">
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <input
                id="header-city-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { if (searchTerm.trim().length > 1) setShowSuggestions(true); }}
                placeholder="Search city e.g. Indore, Delhi..."
                className="w-full pl-9 pr-14 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <button
                type="submit"
                id="header-search-btn"
                className="absolute right-1 px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
              >
                Search
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  Supported Indian Cities
                </div>
                {suggestions.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSuggestionClick(city)}
                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      <span className="font-medium">{city.name}</span>
                      <span className="text-xs text-slate-400">{city.state}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 italic truncate max-w-[120px]">{city.landmark}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Location Button */}
            <button
              id="nav-use-location-btn"
              onClick={onUseLocation}
              title="Use Current Location (GPS)"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
            </button>

            {/* Refresh Button */}
            <button
              id="nav-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="↻ Refresh Weather"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            </button>

            {/* Favorites Icon */}
            <button
              id="nav-favorites-btn"
              onClick={onOpenFavorites}
              title="Favorite Cities"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
            >
              <Star className="w-4 h-4 text-amber-500" />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Recent Searches */}
            <button
              id="nav-history-btn"
              onClick={onOpenHistory}
              title="Recent City Searches"
              className="hidden sm:inline-flex p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <History className="w-4 h-4" />
            </button>

            {/* °C | °F Unit Toggle */}
            <button
              id="unit-toggle-btn"
              onClick={onToggleUnit}
              title="Toggle Celsius / Fahrenheit"
              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-sky-500 transition-colors"
            >
              <span className={unit === 'C' ? 'text-sky-600 dark:text-sky-400 font-extrabold' : 'text-slate-400'}>°C</span>
              <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
              <span className={unit === 'F' ? 'text-sky-600 dark:text-sky-400 font-extrabold' : 'text-slate-400'}>°F</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {/* Mobile Search Input */}
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <input
                id="mobile-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search city (e.g. Indore, Mumbai, Delhi)..."
                className="w-full pl-9 pr-14 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <button
                type="submit"
                id="mobile-search-btn"
                className="absolute right-1 px-3 py-1 text-xs font-semibold bg-sky-600 text-white rounded-lg"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2 text-sm font-medium pt-2">
              <button
                onClick={() => scrollToSection('dashboard')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                🏠 Home
              </button>
              <button
                onClick={() => scrollToSection('current-weather')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                🌤️ Current Weather
              </button>
              <button
                onClick={() => scrollToSection('forecast-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                📅 7-Day Forecast
              </button>
              <button
                onClick={() => scrollToSection('prediction-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                🔮 Prediction
              </button>
              <button
                onClick={() => scrollToSection('aqi-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 font-semibold"
              >
                🍃 Air Quality (AQI)
              </button>
              <button
                onClick={() => scrollToSection('disaster-section')}
                className="text-left px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold"
              >
                🚨 Safe Routes & Hospitals
              </button>
              <button
                onClick={() => scrollToSection('charts-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                📊 Weather Charts
              </button>
              <button
                onClick={() => scrollToSection('weather-map-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                🗺️ Weather Map
              </button>
              <button
                onClick={() => scrollToSection('alerts-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                ⚠️ Alerts
              </button>
              <button
                onClick={() => scrollToSection('about-section')}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                ℹ️ About Project
              </button>
            </div>

            {/* Mobile Theme & Unit Controls */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Display Theme & Unit
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleUnit}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  °{unit}
                </button>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-200" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <button 
                onClick={() => { onUseLocation(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg font-medium"
              >
                <MapPin className="w-3.5 h-3.5" /> Use My Location
              </button>
              <button 
                onClick={() => { onOpenHistory(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium"
              >
                <History className="w-3.5 h-3.5" /> Recent Searches
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
