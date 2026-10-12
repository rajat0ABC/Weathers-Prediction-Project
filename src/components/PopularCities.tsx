import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, MapPin, ArrowRight, RefreshCw, Radio } from 'lucide-react';
import { CityInfo, TempUnit, CityLiveWeather } from '../types';
import { INDIAN_CITIES, POPULAR_CITY_IDS } from '../data/cities';
import { formatTemperature, fetchBatchCitiesWeather } from '../services/weatherService';

interface PopularCitiesProps {
  currentCityId: string;
  onSelectCity: (city: CityInfo) => void;
  unit: TempUnit;
}

export const PopularCities: React.FC<PopularCitiesProps> = ({
  currentCityId,
  onSelectCity,
  unit,
}) => {
  const popularCities = INDIAN_CITIES.filter(c => POPULAR_CITY_IDS.includes(c.id));
  const [weatherMap, setWeatherMap] = useState<Record<string, CityLiveWeather>>({});
  const [loadingMap, setLoadingMap] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const loadLiveTemperatures = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingMap(true);
    setIsRefreshing(true);

    try {
      const data = await fetchBatchCitiesWeather(popularCities);
      if (data && Object.keys(data).length > 0) {
        setWeatherMap(data);
        const now = new Date();
        setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed fetching live popular cities weather:', err);
    } finally {
      setLoadingMap(false);
      setIsRefreshing(false);
    }
  }, [popularCities]);

  // Initial fetch and auto-refresh every 2 minutes
  useEffect(() => {
    loadLiveTemperatures(false);

    const interval = setInterval(() => {
      loadLiveTemperatures(true);
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadLiveTemperatures]);

  return (
    <section id="popular-cities-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Popular Indian Metros
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Real-time live temperatures & conditions across {popularCities.length} major Indian urban hubs
              {lastUpdatedTime && <span className="ml-1 text-[11px] text-slate-400">({lastUpdatedTime})</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadLiveTemperatures(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh live metro temperatures"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Live Sync'}</span>
          </button>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 dark:text-slate-500">
            Click any card to load dashboard
          </span>
        </div>
      </div>

      {/* Grid of popular cities (handles 9 cities responsively) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-3.5">
        {popularCities.map((city) => {
          const isSelected = city.id === currentCityId;
          const weather = weatherMap[city.id];

          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              className={`group relative text-left overflow-hidden rounded-2xl border transition-all duration-300 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/50 shadow-md'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {/* Thumbnail image with subtle gradient */}
              <div className="relative w-full h-20 sm:h-22 rounded-xl overflow-hidden mb-2">
                <img
                  src={city.image}
                  alt={city.landmark}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-white/95 truncate max-w-[90%]">
                  {city.landmark.split(' ')[0]}
                </span>
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-500 text-white shadow-xs">
                    ACTIVE
                  </span>
                )}
              </div>

              {/* City Name & State */}
              <div>
                <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  <MapPin className="w-3 h-3 text-sky-500 flex-shrink-0" />
                  <span className="truncate">{city.name}</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {city.state}
                </div>
              </div>

              {/* Live Temperature & Weather Icon */}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {weather ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                        {formatTemperature(weather.temp, unit)}
                      </span>
                    </div>
                    <span className="text-base sm:text-lg select-none" title={weather.condition}>
                      {weather.icon}
                    </span>
                  </>
                ) : loadingMap ? (
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                  <span className="text-xs text-slate-400 flex items-center gap-0.5 group-hover:text-sky-500">
                    Load <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
