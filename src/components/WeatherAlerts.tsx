import React from 'react';
import { AlertTriangle, ShieldCheck, BellRing, Info, ShieldAlert } from 'lucide-react';
import { WeatherAlertItem } from '../types';

interface WeatherAlertsProps {
  alerts: WeatherAlertItem[];
  cityName: string;
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ alerts, cityName }) => {
  const getSeverityStyle = (severity: 'low' | 'moderate' | 'high') => {
    switch (severity) {
      case 'high':
        return {
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          card: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60',
          dot: 'bg-rose-500',
          label: 'HIGH SEVERITY ALERT',
        };
      case 'moderate':
        return {
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          card: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60',
          dot: 'bg-amber-500',
          label: 'MODERATE ADVISORY',
        };
      case 'low':
      default:
        return {
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          card: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60',
          dot: 'bg-emerald-500',
          label: 'STANDARD STATUS',
        };
    }
  };

  return (
    <section id="alerts-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Weather Advisories & Alerts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Active meteorological alerts and safety guidelines for {cityName}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          Live Safety Protocol Active
        </span>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-3xl border transition-all duration-300 shadow-sm ${style.card} space-y-3`}
            >
              {/* Header with Icon, Title, and Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl select-none" role="img" aria-label={alert.type}>
                    {alert.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {alert.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Category: {alert.type}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border flex items-center gap-1.5 flex-shrink-0 ${style.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
                  {style.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {alert.description}
              </p>

              {/* Recommendation / Safety Actions */}
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 mb-0.5">Recommended Safety Protocol:</strong>
                  <span>{alert.recommendation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
