import React, { useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, Droplets, Wind, CloudRain } from 'lucide-react';
import { HourlyForecastItem, TempUnit } from '../types';
import { formatTemperature } from '../services/weatherService';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  unit: TempUnit;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, unit }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="hourly-forecast-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Hourly Forecast (Next 24 Hours)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live hourly temperature, precipitation probability, humidity and surface wind
            </p>
          </div>
        </div>

        {/* Scroll Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scroll-smooth snap-x select-none"
      >
        {hourly.map((item, index) => {
          const isCurrent = index === 0;

          return (
            <div
              key={item.isoTime || index}
              className={`snap-start flex-shrink-0 w-28 sm:w-32 rounded-2xl p-3.5 border flex flex-col items-center justify-between text-center transition-all ${
                isCurrent
                  ? 'bg-gradient-to-b from-sky-50 to-indigo-50/50 dark:from-sky-950/40 dark:to-slate-900 border-sky-300 dark:border-sky-800 shadow-md ring-1 ring-sky-400/30'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              {/* Time Label */}
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {item.time}
                {isCurrent && (
                  <span className="block text-[9px] font-extrabold uppercase text-sky-600 dark:text-sky-400">
                    Live
                  </span>
                )}
              </div>

              {/* Weather Icon */}
              <div className="my-2 text-3xl select-none" title={item.weatherDesc}>
                {item.weatherIcon}
              </div>

              {/* Temperature */}
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {formatTemperature(item.temp, unit)}
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full my-0.5">
                {item.weatherDesc}
              </div>

              {/* Rain Probability Badge */}
              <div className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                <div 
                  className={`flex items-center justify-center gap-1 font-semibold ${
                    item.precipitationProbability > 40
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="Rain Probability"
                >
                  <CloudRain className="w-3 h-3 text-sky-500" />
                  <span>{item.precipitationProbability}%</span>
                </div>

                {/* Humidity */}
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400" title="Relative Humidity">
                  <Droplets className="w-2.5 h-2.5 text-teal-400" />
                  <span>{item.humidity}%</span>
                </div>

                {/* Wind */}
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400" title="Wind Speed">
                  <Wind className="w-2.5 h-2.5 text-slate-400" />
                  <span>{Math.round(item.windSpeed)} km/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
