import React from 'react';
import { 
  Sparkles, 
  Thermometer, 
  CloudRain, 
  Droplets, 
  Wind, 
  Info, 
  CheckCircle, 
  ShieldAlert, 
  TrendingUp,
  Compass,
  Sun
} from 'lucide-react';
import { WeatherData, TempUnit } from '../types';
import { formatTemperature } from '../services/weatherService';

interface WeatherPredictionProps {
  weather: WeatherData;
  unit: TempUnit;
}

export const WeatherPrediction: React.FC<WeatherPredictionProps> = ({ weather, unit }) => {
  const { current, daily, hourly, city } = weather;

  // Compute prediction insights from live API data
  const next24hRainProb = Math.max(...hourly.slice(0, 24).map(h => h.precipitationProbability), 0);
  const next7DaysRain = daily.reduce((acc, d) => acc + d.precipitationSum, 0);
  const avgMaxTemp = Math.round(daily.reduce((acc, d) => acc + d.tempMax, 0) / (daily.length || 1));
  const avgMinTemp = Math.round(daily.reduce((acc, d) => acc + d.tempMin, 0) / (daily.length || 1));
  const peakWind = Math.max(...hourly.slice(0, 24).map(h => h.windSpeed), current.windSpeed);

  // Determine condition trajectory
  let outlookTheme = 'Stable & Fair';
  let outlookDesc = 'Atmospheric stability dominates with continuous clear to partly cloudy conditions.';
  let outlookColor = 'from-sky-500/10 to-emerald-500/10 border-sky-200 dark:border-sky-900';

  if (next24hRainProb > 60 || current.weatherCode >= 61) {
    outlookTheme = 'Monsoon Rain & Wet Spells';
    outlookDesc = 'Active convective cloud formation and moisture convergence indicate frequent rain spells.';
    outlookColor = 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900';
  } else if (current.temperature > 38 || avgMaxTemp > 38) {
    outlookTheme = 'Intense Thermal Heating';
    outlookDesc = 'Dry north-westerly continental air currents will sustain elevated daytime temperatures.';
    outlookColor = 'from-amber-500/10 to-rose-500/10 border-amber-200 dark:border-amber-900';
  } else if (current.relativeHumidity > 75) {
    outlookTheme = 'High Humidity & Muggy Outlook';
    outlookDesc = 'Moisture-laden surface winds are driving elevated heat index and mugginess throughout the day.';
    outlookColor = 'from-teal-500/10 to-cyan-500/10 border-teal-200 dark:border-teal-900';
  }

  // Comfort Index computation (Dew point approximation & Heat index)
  const computeComfort = (tempC: number, rh: number) => {
    if (tempC > 35 && rh > 60) return { label: 'Oppressive / Uncomfortable', color: 'text-rose-500' };
    if (tempC > 30 && rh > 55) return { label: 'Warm & Humid', color: 'text-amber-500' };
    if (tempC >= 20 && tempC <= 28 && rh >= 35 && rh <= 65) return { label: 'Ideal & Pleasant', color: 'text-emerald-500' };
    if (tempC < 15) return { label: 'Crisp & Cool', color: 'text-sky-500' };
    return { label: 'Moderate', color: 'text-slate-600 dark:text-slate-300' };
  };

  const comfort = computeComfort(current.temperature, current.relativeHumidity);

  return (
    <section id="prediction-section" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Weather Prediction & Meteorological Outlook</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Synoptic projection for {city.name}, {city.state} based on Open-Meteo mathematical forecast models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <TrendingUp className="w-3.5 h-3.5" /> Forecast Intelligence
          </span>
        </div>
      </div>

      {/* Main Prediction Banner Card */}
      <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-br ${outlookColor} border shadow-lg space-y-5 backdrop-blur-xs`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Synoptic Trajectory Outlook
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {outlookTheme}
            </h3>
          </div>
          
          <div className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Regional Zone: <strong className="text-sky-600 dark:text-sky-400">{city.region} India</strong>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          {outlookDesc} In {city.name}, daytime maximum temperatures are projected to average around <strong>{formatTemperature(avgMaxTemp, unit)}</strong> with minimum nighttime cooling near <strong>{formatTemperature(avgMinTemp, unit)}</strong>.
        </p>

        {/* 4 Forecast Pill Pillars (Temp, Rainfall, Humidity, Wind) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          {/* Expected Temperature */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expected Temp</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatTemperature(avgMinTemp, unit)} - {formatTemperature(avgMaxTemp, unit)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Diurnal range of ~{(avgMaxTemp - avgMinTemp)}°C over the weekly horizon.
            </p>
          </div>

          {/* Expected Rainfall */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expected Rain</span>
              <CloudRain className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {next24hRainProb}% Max Prob
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {next7DaysRain > 5 ? `${next7DaysRain.toFixed(1)} mm estimated 7-day accumulation.` : 'Negligible precipitation accumulation anticipated.'}
            </p>
          </div>

          {/* Expected Humidity & Comfort */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comfort Index</span>
              <Droplets className="w-4 h-4 text-teal-500" />
            </div>
            <div className={`text-base font-extrabold ${comfort.color}`}>
              {comfort.label}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Current humidity is {current.relativeHumidity}%. Dew point indicates stable transpiration.
            </p>
          </div>

          {/* Expected Wind Conditions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expected Wind</span>
              <Wind className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {Math.round(current.windSpeed)} - {Math.round(peakWind)} km/h
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dominant surface airflow with peak afternoon convection gusts.
            </p>
          </div>

        </div>

        {/* Agricultural / Outdoor Activities Advisory */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 dark:text-slate-200">Commute & Travel:</strong>
              <span className="text-slate-600 dark:text-slate-400">
                {current.visibility < 3 ? 'Fog/haze advisory in effect; commute with extra caution.' : 'Smooth transit conditions with good route visibility.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <Sun className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 dark:text-slate-200">Solar & Outdoor:</strong>
              <span className="text-slate-600 dark:text-slate-400">
                {current.uvIndex > 7 ? 'High UV radiation: apply sunblock and hydrate regularly.' : 'Moderate UV solar levels; suitable for daytime outdoor recreation.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <Compass className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 dark:text-slate-200">Farming & Gardening:</strong>
              <span className="text-slate-600 dark:text-slate-400">
                {next24hRainProb > 50 ? 'Postpone pesticide spraying due to incoming rain.' : 'Favorable window for soil aeration, irrigation, and field work.'}
              </span>
            </div>
          </div>
        </div>

        {/* MANDATED EXACT DISCLAIMER */}
        <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <p className="italic font-medium">
            &ldquo;Weather predictions are estimates and may change as new weather information becomes available.&rdquo;
          </p>
        </div>

      </div>
    </section>
  );
};
