import React from 'react';
import { 
  Wind, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Info, 
  Heart, 
  Baby, 
  Sparkles,
  Layers,
  ThermometerSnowflake,
  ExternalLink
} from 'lucide-react';
import { AirQualityData } from '../types';

interface AirQualitySectionProps {
  aqi?: AirQualityData;
  cityName: string;
}

export const AirQualitySection: React.FC<AirQualitySectionProps> = ({ aqi, cityName }) => {
  if (!aqi) {
    return null;
  }

  // CPCB Color schemes based on category
  const getCategoryStyles = (category: AirQualityData['category']) => {
    switch (category) {
      case 'Good':
        return {
          bgBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          gaugeColor: '#10b981',
          progressClass: 'bg-emerald-500',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          description: 'Air quality is considered clean and poses negligible or minimal respiratory risk.',
        };
      case 'Satisfactory':
        return {
          bgBadge: 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/30',
          gaugeColor: '#84cc16',
          progressClass: 'bg-lime-500',
          textColor: 'text-lime-600 dark:text-lime-400',
          description: 'Minor breathing discomfort may be experienced by particularly sensitive individuals.',
        };
      case 'Moderate':
        return {
          bgBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          gaugeColor: '#f59e0b',
          progressClass: 'bg-amber-500',
          textColor: 'text-amber-600 dark:text-amber-400',
          description: 'May cause breathing discomfort to children, elderly, and individuals with asthma or heart ailments.',
        };
      case 'Poor':
        return {
          bgBadge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
          gaugeColor: '#f97316',
          progressClass: 'bg-orange-500',
          textColor: 'text-orange-600 dark:text-orange-400',
          description: 'Breathing discomfort to most people on prolonged exposure. Sensitive groups should wear N95 masks outdoors.',
        };
      case 'Very Poor':
        return {
          bgBadge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          gaugeColor: '#f43f5e',
          progressClass: 'bg-rose-500',
          textColor: 'text-rose-600 dark:text-rose-400',
          description: 'High risk of respiratory illnesses on prolonged exposure. Reduce outdoor morning activities.',
        };
      case 'Severe':
      default:
        return {
          bgBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
          gaugeColor: '#a855f7',
          progressClass: 'bg-purple-600',
          textColor: 'text-purple-600 dark:text-purple-400',
          description: 'Emergency health warning: serious respiratory impacts on healthy individuals and high risk for vulnerable groups.',
        };
    }
  };

  const styles = getCategoryStyles(aqi.category);
  const aqiPercentage = Math.min(100, Math.max(5, (aqi.aqi / 500) * 100));

  // Pollutant evaluation standards based on CPCB guidelines (in μg/m³)
  const pollutants = [
    {
      name: 'PM2.5',
      fullName: 'Fine Particulates (<2.5 µm)',
      value: aqi.pm2_5,
      unit: 'µg/m³',
      safeThreshold: 60,
      description: 'Penetrates deep into respiratory tract and bloodstream',
      ratio: Math.min(100, (aqi.pm2_5 / 120) * 100),
      isElevated: aqi.pm2_5 > 60,
    },
    {
      name: 'PM10',
      fullName: 'Inhalable Dust (<10 µm)',
      value: aqi.pm10,
      unit: 'µg/m³',
      safeThreshold: 100,
      description: 'Suspended coarse dust, road silt, and soot particles',
      ratio: Math.min(100, (aqi.pm10 / 250) * 100),
      isElevated: aqi.pm10 > 100,
    },
    {
      name: 'NO₂',
      fullName: 'Nitrogen Dioxide',
      value: aqi.no2,
      unit: 'µg/m³',
      safeThreshold: 80,
      description: 'Combustion byproduct from vehicles and power stations',
      ratio: Math.min(100, (aqi.no2 / 100) * 100),
      isElevated: aqi.no2 > 80,
    },
    {
      name: 'SO₂',
      fullName: 'Sulphur Dioxide',
      value: aqi.so2,
      unit: 'µg/m³',
      safeThreshold: 80,
      description: 'Emissions from thermal power plants and refineries',
      ratio: Math.min(100, (aqi.so2 / 100) * 100),
      isElevated: aqi.so2 > 80,
    },
    {
      name: 'O₃',
      fullName: 'Surface Ozone',
      value: aqi.o3,
      unit: 'µg/m³',
      safeThreshold: 100,
      description: 'Photochemical smog oxidant formed under intense sunlight',
      ratio: Math.min(100, (aqi.o3 / 180) * 100),
      isElevated: aqi.o3 > 100,
    },
    {
      name: 'CO',
      fullName: 'Carbon Monoxide',
      value: aqi.co,
      unit: 'µg/m³',
      safeThreshold: 2000,
      description: 'Incomplete vehicular exhaust combustion byproduct',
      ratio: Math.min(100, (aqi.co / 3000) * 100),
      isElevated: aqi.co > 2000,
    },
  ];

  return (
    <section 
      id="aqi-section" 
      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 transition-all"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-xs">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                National Air Quality Index (NAQI)
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                CPCB Standards
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Continuous ambient atmospheric pollution & particulate monitoring for <strong>{cityName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Real-time CPCB telemetry</span>
        </div>
      </div>

      {/* Main AQI Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Big AQI Gauge and Badge */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-900/60 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Composite Air Index
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${styles.bgBadge}`}>
              {aqi.category}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className={`text-6xl sm:text-7xl font-black tracking-tight ${styles.textColor}`}>
              {aqi.aqi}
            </span>
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                AQI Level
              </span>
              <p className="text-xs text-slate-400">
                Scale 0 to 500
              </p>
            </div>
          </div>

          {/* Graphical Meter Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>0 Good</span>
              <span>100 Mod</span>
              <span>200 Poor</span>
              <span>500 Severe</span>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${styles.progressClass}`} 
                style={{ width: `${aqiPercentage}%` }}
              />
            </div>
          </div>

          {/* Dominant Pollutant tag */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              Primary Contributor:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-lg">
              {aqi.dominantPollutant}
            </span>
          </div>
        </div>

        {/* Right Column: Health Guidance & Protective Advisories */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>Public Health Recommendation</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {aqi.healthRecommendation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Sensitive Groups & Asthma</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-normal">
                {aqi.sensitiveGroupWarning}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                <Baby className="w-3.5 h-3.5 text-indigo-500" />
                <span>Outdoor Activity & Recreation</span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80 leading-normal">
                {aqi.aqi > 200 
                  ? 'Limit intense sports workouts. Prefer early morning sessions before vehicle traffic escalates.' 
                  : 'Safe for morning walks, school playgrounds, cycling, and leisure sports in open gardens.'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 6 Key Pollutants Breakdown Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
            <span>Atmospheric Chemical & Particulate Breakdown</span>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">(CPCB Ambient Monitoring)</span>
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            Micrograms per cubic meter (µg/m³)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {pollutants.map((p) => (
            <div 
              key={p.name}
              className={`p-3.5 rounded-2xl border transition-all ${
                p.isElevated 
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {p.name}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  p.isElevated 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                }`}>
                  {p.isElevated ? 'Elevated' : 'Safe'}
                </span>
              </div>

              <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
                {p.value} <span className="text-[10px] font-medium text-slate-400">{p.unit}</span>
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={p.fullName}>
                {p.fullName}
              </div>

              {/* Threshold Meter */}
              <div className="mt-2.5 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${p.isElevated ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${p.ratio}%` }}
                />
              </div>

              <div className="mt-1 text-[9px] text-slate-400 flex justify-between">
                <span>Safe: &lt;{p.safeThreshold}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CPCB National Classification Reference Legend */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 block">Good</span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">0 – 50</span>
          </div>
          <div className="p-2 rounded-xl bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800/50">
            <span className="font-bold text-lime-700 dark:text-lime-300 block">Satisfactory</span>
            <span className="text-[10px] text-lime-600/80 dark:text-lime-400/80">51 – 100</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
            <span className="font-bold text-amber-700 dark:text-amber-300 block">Moderate</span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">101 – 200</span>
          </div>
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50">
            <span className="font-bold text-orange-700 dark:text-orange-300 block">Poor</span>
            <span className="text-[10px] text-orange-600/80 dark:text-orange-400/80">201 – 300</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
            <span className="font-bold text-rose-700 dark:text-rose-300 block">Very Poor</span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">301 – 400</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50">
            <span className="font-bold text-purple-700 dark:text-purple-300 block">Severe</span>
            <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80">401 – 500</span>
          </div>
        </div>
      </div>

    </section>
  );
};
