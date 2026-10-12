import React from 'react';
import { 
  Wind, 
  Droplets, 
  Gauge, 
  Eye, 
  Sun, 
  Sunset, 
  Sunrise, 
  Cloud, 
  Compass, 
  Clock, 
  Calendar, 
  Sparkles,
  Star,
  Share2,
  CheckCircle2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { WeatherData, TempUnit } from '../types';
import { formatTemperature, getWindDirection } from '../services/weatherService';

interface CurrentWeatherCardProps {
  weather: WeatherData;
  unit: TempUnit;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weather,
  unit,
  isFavorite,
  onToggleFavorite,
  onRefresh,
  isRefreshing,
}) => {
  const { city, current, lastUpdated, cityLocalTime, cityLocalDate } = weather;
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      const text = `Current Weather in ${city.name}, ${city.state}: ${formatTemperature(current.temperature, unit)}, ${current.weatherDesc}. Live data via Open-Meteo!`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // UV risk level badge
  const getUvRisk = (uv: number) => {
    if (uv < 3) return { text: 'Low', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
    if (uv < 6) return { text: 'Moderate', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' };
    if (uv < 8) return { text: 'High', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800' };
    if (uv < 11) return { text: 'Very High', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' };
    return { text: 'Extreme', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' };
  };

  const uvRisk = getUvRisk(current.uvIndex);
  const compassDir = getWindDirection(current.windDirection);
  const todayDaily = weather.daily[0];

  return (
    <div 
      id="current-weather"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 transition-all"
    >
      {/* Background atmospheric decorative blur */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 rounded-full bg-amber-400/10 dark:bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Header bar: Live Data Badge, Open-Meteo source, Favorite & Share */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE DATA</span>
          </div>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Data Source: <strong className="text-slate-700 dark:text-slate-300">Open-Meteo</strong>
          </span>

          {weather.aqi && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('aqi-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer hover:scale-105 transition-transform bg-teal-50 dark:bg-teal-950/70 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300"
              title="Click to view National Air Quality Index (NAQI) details"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>AQI {weather.aqi.aqi} • {weather.aqi.category}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('disaster-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer hover:scale-105 transition-transform bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-xs"
            title="Click to view Disaster Early Warning & Safe Evacuation Routes"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Safe Routes</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>

          {/* Favorite Toggle */}
          <button
            id="favorite-toggle-btn"
            onClick={onToggleFavorite}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isFavorite 
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>{isFavorite ? 'Saved' : 'Save City'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Copy weather snapshot"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Weather Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left column: City & Temperature */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {city.name}
              </h1>
              {city.hindiName && (
                <span className="text-xl sm:text-2xl text-slate-400 dark:text-slate-500 font-medium">
                  ({city.hindiName})
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 mt-1">
              {city.state}, India &bull; <span className="text-sky-600 dark:text-sky-400">{city.region} Region</span>
            </p>
          </div>

          {/* Big Temperature & Icon */}
          <div className="flex items-center gap-6">
            <div className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-slate-900 dark:text-white flex items-start">
              <span>{formatTemperature(current.temperature, unit)}</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-5xl sm:text-6xl select-none transform hover:scale-110 transition-transform">
                {current.weatherIcon}
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1 text-center">
                {current.weatherDesc}
              </span>
            </div>
          </div>

          {/* Feels Like & High/Low */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              Feels Like: <strong className="text-slate-800 dark:text-slate-100">{formatTemperature(current.apparentTemperature, unit)}</strong>
            </div>
            {todayDaily && (
              <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                High: <strong className="text-amber-600 dark:text-amber-400">{formatTemperature(todayDaily.tempMax, unit)}</strong> &bull; Low: <strong className="text-sky-600 dark:text-sky-400">{formatTemperature(todayDaily.tempMin, unit)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Local Time & Landmark Preview Tag */}
        <div className="lg:col-span-6 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[11px]">Local City Time</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{cityLocalTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[11px]">Current Date</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{cityLocalDate}</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Last Updated: <strong className="text-slate-700 dark:text-slate-300">{lastUpdated}</strong></span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              GPS: {city.lat.toFixed(2)}°N, {city.lon.toFixed(2)}°E
            </span>
          </div>

          {city.landmark && (
            <div className="bg-sky-500/10 dark:bg-sky-400/10 border border-sky-200 dark:border-sky-900/50 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="font-medium text-sky-900 dark:text-sky-300">
                Landmark: <strong>{city.landmark}</strong>
              </span>
              <a 
                href="#city-landmark" 
                className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                View Photo &rarr;
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 8 Metric Tiles Grid (Humidity, Wind, Pressure, Visibility, UV, Cloud Cover, Sunrise, Sunset) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-6 border-t border-slate-200/70 dark:border-slate-800">
        
        {/* Humidity */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Humidity</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{current.relativeHumidity}%</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {current.relativeHumidity > 70 ? 'Humid' : current.relativeHumidity > 40 ? 'Comfortable' : 'Dry'}
            </div>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Wind</span>
            <Wind className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(current.windSpeed)} km/h</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Compass className="w-3 h-3 text-teal-500" /> {compassDir} ({current.windDirection}°)
            </div>
          </div>
        </div>

        {/* Atmospheric Pressure */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pressure</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{current.surfacePressure} hPa</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Barometric</div>
          </div>
        </div>

        {/* Visibility */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Visibility</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{current.visibility.toFixed(1)} km</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {current.visibility >= 10 ? 'Crystal Clear' : current.visibility >= 5 ? 'Good' : 'Hazy / Fog'}
            </div>
          </div>
        </div>

        {/* UV Index */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">UV Index</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{current.uvIndex}</div>
            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${uvRisk.color}`}>
              {uvRisk.text}
            </span>
          </div>
        </div>

        {/* Cloud Cover */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Clouds</span>
            <Cloud className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">{current.cloudCover}%</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Coverage</div>
          </div>
        </div>

        {/* Sunrise */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sunrise</span>
            <Sunrise className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {todayDaily?.sunrise || '06:00 AM'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dawn</div>
          </div>
        </div>

        {/* Sunset */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-purple-400 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sunset</span>
            <Sunset className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {todayDaily?.sunset || '06:30 PM'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dusk</div>
          </div>
        </div>

      </div>
    </div>
  );
};
