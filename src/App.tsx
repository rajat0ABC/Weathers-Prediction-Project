import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  Search, 
  MapPin, 
  CloudSun, 
  Compass, 
  Sparkles,
  WifiOff
} from 'lucide-react';
import { CityInfo, WeatherData, TempUnit, ThemeMode } from './types';
import { INDIAN_CITIES, findCityById } from './data/cities';
import { 
  fetchLiveWeatherData, 
  searchOpenMeteoCity, 
  findClosestCity 
} from './services/weatherService';

import { Navbar } from './components/Navbar';
import { SearchBarSection } from './components/SearchBarSection';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { AirQualitySection } from './components/AirQualitySection';
import { DisasterManagementSection } from './components/DisasterManagementSection';
import { CityLandmarkCard } from './components/CityLandmarkCard';
import { PopularCities } from './components/PopularCities';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { WeatherPrediction } from './components/WeatherPrediction';
import { WeatherCharts } from './components/WeatherCharts';
import { WeatherAlerts } from './components/WeatherAlerts';
import { IndiaWeatherMap } from './components/IndiaWeatherMap';
import { FavoritesAndRecent } from './components/FavoritesAndRecent';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';

export default function App() {
  // Theme & Unit State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('weather_india_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [unit, setUnit] = useState<TempUnit>(() => {
    const saved = localStorage.getItem('weather_india_unit');
    return saved === 'F' ? 'F' : 'C';
  });

  // Selected City (Default to Indore per user specification)
  const [selectedCity, setSelectedCity] = useState<CityInfo>(() => {
    return findCityById('indore') || INDIAN_CITIES[0];
  });

  // Weather Data & Async States
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Favorites & History (LocalStorage)
  const [favorites, setFavorites] = useState<CityInfo[]>(() => {
    try {
      const saved = localStorage.getItem('weather_india_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('weather_india_recents');
      return saved ? JSON.parse(saved) : ['Indore', 'Bhopal', 'Mumbai', 'Delhi', 'Bengaluru'];
    } catch {
      return ['Indore', 'Bhopal', 'Mumbai', 'Delhi', 'Bengaluru'];
    }
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'favorites' | 'history'>('favorites');

  // Synchronize Dark Mode Class on Root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('weather_india_theme', theme);
  }, [theme]);

  // Synchronize Unit
  useEffect(() => {
    localStorage.setItem('weather_india_unit', unit);
  }, [unit]);

  // Synchronize Favorites
  useEffect(() => {
    localStorage.setItem('weather_india_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Synchronize Recents
  useEffect(() => {
    localStorage.setItem('weather_india_recents', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Add to Recent Searches
  const recordRecentSearch = useCallback((cityName: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== cityName.toLowerCase());
      return [cityName, ...filtered].slice(0, 10);
    });
  }, []);

  // Fetch Weather Data for City
  const loadWeather = useCallback(async (city: CityInfo, showSpinner = true) => {
    if (showSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setErrorMsg(null);

    try {
      const data = await fetchLiveWeatherData(city);
      setWeatherData(data);
      recordRecentSearch(city.name);
    } catch (err: any) {
      console.error('Failed to load weather data:', err);
      setErrorMsg(
        err?.message || 'Unable to load weather data from Open-Meteo. Please check your network connection and try again.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [recordRecentSearch]);

  // Selected City change handler that triggers reliable fetch
  const handleSelectCity = useCallback((city: CityInfo) => {
    setSelectedCity(city);
    loadWeather(city, true);
  }, [loadWeather]);

  // Initial Load
  useEffect(() => {
    loadWeather(selectedCity, true);
  }, []); // Run on mount

  // Auto-refresh interval (every 5 minutes / 300,000 ms without reloading page)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCity) {
        console.log('Auto-refreshing live weather for', selectedCity.name);
        loadWeather(selectedCity, false);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedCity, loadWeather]);

  // Handler: Manual Refresh
  const handleRefresh = () => {
    if (selectedCity && !isRefreshing) {
      loadWeather(selectedCity, false);
    }
  };

  // Handler: Search city by name
  const handleSearch = async (searchTerm: string) => {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const results = await searchOpenMeteoCity(cleanTerm);
      if (results && results.length > 0) {
        const topMatch = results[0];
        handleSelectCity(topMatch);
      } else {
        setErrorMsg(`City "${cleanTerm}" could not be found. Please check spelling or select from our 40+ supported Indian cities.`);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg('Error searching for city. Please try again.');
      setIsLoading(false);
    }
  };

  // Handler: Geolocation ("📍 Use My Location")
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please search for a city manually.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const matchedCity = findClosestCity(latitude, longitude);
        handleSelectCity(matchedCity);
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setErrorMsg('Location permission was not provided. Please search for a city.');
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handler: Toggle Favorite
  const handleToggleFavorite = () => {
    if (!selectedCity) return;
    const exists = favorites.some((f) => f.id === selectedCity.id);
    if (exists) {
      setFavorites(favorites.filter((f) => f.id !== selectedCity.id));
    } else {
      setFavorites([...favorites, selectedCity]);
    }
  };

  const handleRemoveFavorite = (cityId: string) => {
    setFavorites(favorites.filter((f) => f.id !== cityId));
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
  };

  const isCurrentFavorite = Boolean(
    selectedCity && favorites.some((f) => f.id === selectedCity.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 selection:bg-sky-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        unit={unit}
        onToggleUnit={() => setUnit(unit === 'C' ? 'F' : 'C')}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onSelectCity={handleSelectCity}
        favoritesCount={favorites.length}
        onOpenFavorites={() => {
          setModalTab('favorites');
          setModalOpen(true);
        }}
        onOpenHistory={() => {
          setModalTab('history');
          setModalOpen(true);
        }}
      />

      {/* Main Page Layout Container */}
      <main id="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Prominent City Search & Quick Pick Bar */}
        <SearchBarSection
          onSearch={handleSearch}
          onSelectCity={handleSelectCity}
          onUseLocation={handleUseLocation}
          currentCity={selectedCity}
        />

        {/* Error Alert Banner with Retry Button */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
            <button
              onClick={() => loadWeather(selectedCity, true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-200 dark:bg-slate-800/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <CloudSun className="w-10 h-10 animate-bounce text-sky-500" />
                <span className="text-sm font-semibold tracking-wide">
                  Loading live weather data from Open-Meteo...
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800/40" />
              ))}
            </div>

            <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
          </div>
        ) : weatherData ? (
          <>
            {/* SECTION 1 & 7: Hero Current Weather Card */}
            <CurrentWeatherCard
              weather={weatherData}
              unit={unit}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={handleToggleFavorite}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />

            {/* National Air Quality Index (NAQI) - CPCB */}
            <AirQualitySection
              aqi={weatherData.aqi}
              cityName={selectedCity.name}
            />

            {/* Disaster Early Warning & Safe Evacuation Routing */}
            <DisasterManagementSection
              city={selectedCity}
              weather={weatherData.current}
              assessment={weatherData.disasterAssessment}
              theme={theme}
            />

            {/* SECTION 9: Dynamic Iconic City Image Card */}
            <CityLandmarkCard city={selectedCity} />

            {/* SECTION 12: Popular Cities Grid */}
            <PopularCities
              currentCityId={selectedCity.id}
              onSelectCity={handleSelectCity}
              unit={unit}
            />

            {/* SECTION 13: Hourly Forecast (Next 24 Hours) */}
            <HourlyForecast hourly={weatherData.hourly} unit={unit} />

            {/* SECTION 14: 7-Day Synoptic Forecast */}
            <DailyForecast daily={weatherData.daily} unit={unit} />

            {/* SECTION 15: Dedicated Weather Prediction Section */}
            <WeatherPrediction weather={weatherData} unit={unit} />

            {/* SECTION 16: Weather Charts (Chart.js) */}
            <WeatherCharts weather={weatherData} unit={unit} theme={theme} />

            {/* SECTION 17: Weather Alerts & Safety Advisories */}
            <WeatherAlerts alerts={weatherData.alerts} cityName={selectedCity.name} />

            {/* SECTION 18: Interactive India Weather Map (Leaflet.js) */}
            <IndiaWeatherMap
              currentCity={selectedCity}
              onSelectCity={handleSelectCity}
              unit={unit}
              theme={theme}
            />

            {/* Academic & Demonstration Project Details */}
            <AboutSection />
          </>
        ) : null}

      </main>

      {/* Favorites & Recent Searches Modal */}
      <FavoritesAndRecent
        isOpen={modalOpen}
        activeTab={modalTab}
        onClose={() => setModalOpen(false)}
        favorites={favorites}
        recentSearches={recentSearches}
        onSelectCityByName={(name) => {
          handleSearch(name);
          setModalOpen(false);
        }}
        onSelectCity={(city) => {
          handleSelectCity(city);
          setModalOpen(false);
        }}
        onRemoveFavorite={handleRemoveFavorite}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}
