import React from 'react';
import { CloudSun, ArrowUp, Heart, Sparkles, MapPin, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & description */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <CloudSun className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Weather Prediction India
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Real-time atmospheric monitoring, synoptic weather prediction, and iconic landmark imagery across 40+ Indian metropolises.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open-Meteo Live Data Stream Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="#current-weather" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Current Weather
                </a>
              </li>
              <li>
                <a href="#forecast-section" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  7-Day Forecast
                </a>
              </li>
              <li>
                <a href="#prediction-section" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Synoptic Prediction
                </a>
              </li>
              <li>
                <a href="#charts-section" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Weather Charts
                </a>
              </li>
              <li>
                <a href="#weather-map-section" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  India Map
                </a>
              </li>
            </ul>
          </div>

          {/* Attribution & Technologies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Data & Libraries
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1">
                  Open-Meteo API (WMO)
                </a>
              </li>
              <li>
                <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Leaflet.js Mapping
                </a>
              </li>
              <li>
                <a href="https://www.chartjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  Chart.js Telemetry
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-400">Pure HTML5 / CSS3 / JS / TS</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Weather Prediction India. Academic & Hackathon Frontend Project.
          </p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
