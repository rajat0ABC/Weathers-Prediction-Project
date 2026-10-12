import React from 'react';
import { Calendar, CloudRain, Sunrise, Sunset, Sun, ArrowUp, ArrowDown } from 'lucide-react';
import { DailyForecastItem, TempUnit } from '../types';
import { formatTemperature } from '../services/weatherService';

interface DailyForecastProps {
  daily: DailyForecastItem[];
  unit: TempUnit;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily, unit }) => {
  // Find global min and max across the 7 days to calculate proportional temperature range bars
  const allMins = daily.map(d => d.tempMin);
  const allMaxs = daily.map(d => d.tempMax);
  const globalMin = Math.min(...allMins, 10);
  const globalMax = Math.max(...allMaxs, 35);
  const range = globalMax - globalMin || 1;

  return (
    <section id="forecast-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              7-Day Weather Forecast
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Extended synoptic projection with temperature trajectories, rain risk & solar timings
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Open-Meteo Synoptic Model
        </span>
      </div>

      {/* 7 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {daily.map((item, index) => {
          const isToday = index === 0;
          
          // Calculate bar percentages
          const leftPercent = Math.max(0, Math.min(80, ((item.tempMin - globalMin) / range) * 100));
          const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((item.tempMax - item.tempMin) / range) * 100));

          return (
            <div
              key={item.date}
              className={`rounded-2xl p-4 border flex flex-col justify-between transition-all duration-300 ${
                isToday
                  ? 'bg-gradient-to-b from-sky-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 border-sky-300 dark:border-sky-800 shadow-md ring-1 ring-sky-400/30'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
              }`}
            >
              {/* Day & Date Header */}
              <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className={`font-bold text-sm sm:text-base ${isToday ? 'text-sky-600 dark:text-sky-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.dayName}
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {item.fullDateStr}
                </div>
              </div>

              {/* Weather Icon and Condition */}
              <div className="my-3 flex flex-col items-center text-center">
                <span className="text-4xl select-none transform hover:scale-110 transition-transform">
                  {item.weatherIcon}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                  {item.weatherDesc}
                </span>
              </div>

              {/* Temperature Max & Min */}
              <div className="space-y-1.5 my-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center text-sky-600 dark:text-sky-400 font-semibold gap-0.5">
                    <ArrowDown className="w-3 h-3" /> {formatTemperature(item.tempMin, unit)}
                  </span>
                  <span className="flex items-center text-amber-600 dark:text-amber-400 font-bold gap-0.5">
                    <ArrowUp className="w-3 h-3" /> {formatTemperature(item.tempMax, unit)}
                  </span>
                </div>

                {/* Visual Temperature Range Bar */}
                <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rain and Precipitation Info */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-sky-500" /> Rain Prob
                  </span>
                  <strong className={item.precipitationProbabilityMax > 40 ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                    {item.precipitationProbabilityMax}%
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                  <span>Total Precip</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{item.precipitationSum.toFixed(1)} mm</span>
                </div>
              </div>

              {/* Sunrise and Sunset */}
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Sunrise className="w-3 h-3 text-amber-400" />
                  <span>{item.sunrise}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Sunset className="w-3 h-3 text-purple-400" />
                  <span>{item.sunset}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
