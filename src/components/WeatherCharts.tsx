import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { LineChart, BarChart2, Droplets, Wind, Thermometer, CloudRain } from 'lucide-react';
import { WeatherData, TempUnit, ThemeMode } from '../types';
import { cToF } from '../services/weatherService';

interface WeatherChartsProps {
  weather: WeatherData;
  unit: TempUnit;
  theme: ThemeMode;
}

type ChartType = 'temp' | 'rain' | 'humidity' | 'wind';

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ weather, unit, theme }) => {
  const [activeChart, setActiveChart] = useState<ChartType>('temp');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  // Prepare hourly data (24 data points)
  const hourlyData = weather.hourly.slice(0, 24);
  const labels = hourlyData.map(h => h.time);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy prior chart instance if existing
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let chartConfig: any = null;

    if (activeChart === 'temp') {
      const temps = hourlyData.map(h => (unit === 'F' ? cToF(h.temp) : h.temp));
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)');
      gradient.addColorStop(1, isDark ? 'rgba(245, 158, 11, 0.0)' : 'rgba(245, 158, 11, 0.0)');

      chartConfig = {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: `Temperature (°${unit})`,
              data: temps,
              borderColor: '#f59e0b',
              backgroundColor: gradient,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#f59e0b',
              pointBorderColor: isDark ? '#0f172a' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              callbacks: {
                label: (context: any) => ` ${context.parsed.y}°${unit}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                callback: (val: any) => `${val}°${unit}`,
              },
            },
          },
        },
      };
    } else if (activeChart === 'rain') {
      const rainProbs = hourlyData.map(h => h.precipitationProbability);

      chartConfig = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Rain Probability (%)',
              data: rainProbs,
              backgroundColor: isDark ? 'rgba(14, 165, 233, 0.6)' : 'rgba(14, 165, 233, 0.7)',
              borderColor: '#0ea5e9',
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              callbacks: {
                label: (context: any) => ` Chance of Rain: ${context.parsed.y}%`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                callback: (val: any) => `${val}%`,
              },
            },
          },
        },
      };
    } else if (activeChart === 'humidity') {
      const humidities = hourlyData.map(h => h.humidity);

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, isDark ? 'rgba(20, 184, 166, 0.35)' : 'rgba(20, 184, 166, 0.25)');
      gradient.addColorStop(1, isDark ? 'rgba(20, 184, 166, 0.0)' : 'rgba(20, 184, 166, 0.0)');

      chartConfig = {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Relative Humidity (%)',
              data: humidities,
              borderColor: '#14b8a6',
              backgroundColor: gradient,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#14b8a6',
              pointBorderColor: isDark ? '#0f172a' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              callbacks: {
                label: (context: any) => ` Humidity: ${context.parsed.y}%`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                callback: (val: any) => `${val}%`,
              },
            },
          },
        },
      };
    } else if (activeChart === 'wind') {
      const winds = hourlyData.map(h => Math.round(h.windSpeed));

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)');
      gradient.addColorStop(1, isDark ? 'rgba(99, 102, 241, 0.0)' : 'rgba(99, 102, 241, 0.0)');

      chartConfig = {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Wind Speed (km/h)',
              data: winds,
              borderColor: '#6366f1',
              backgroundColor: gradient,
              borderWidth: 3,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#6366f1',
              pointBorderColor: isDark ? '#0f172a' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              callbacks: {
                label: (context: any) => ` Wind: ${context.parsed.y} km/h`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              min: 0,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                callback: (val: any) => `${val} km/h`,
              },
            },
          },
        },
      };
    }

    if (chartConfig) {
      chartInstanceRef.current = new Chart(ctx, chartConfig);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [activeChart, weather, unit, isDark]);

  return (
    <section id="charts-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <LineChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Interactive Meteorological Charts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live diurnal progression rendered with Chart.js using real Open-Meteo telemetry
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setActiveChart('temp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeChart === 'temp'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setActiveChart('rain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeChart === 'rain'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rain Risk</span>
          </button>

          <button
            onClick={() => setActiveChart('humidity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeChart === 'humidity'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Humidity</span>
          </button>

          <button
            onClick={() => setActiveChart('wind')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeChart === 'wind'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
        
        {/* Dynamic description header */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {activeChart === 'temp' && `24-Hour Diurnal Temperature Curve (°${unit})`}
            {activeChart === 'rain' && 'Hourly Convective Rain Probability (%)'}
            {activeChart === 'humidity' && 'Relative Atmospheric Humidity Cycle (%)'}
            {activeChart === 'wind' && 'Near-Surface 10m Wind Velocity (km/h)'}
          </span>
          <span className="text-slate-400 font-mono">
            Location: {weather.city.name}
          </span>
        </div>

        {/* Canvas container with guaranteed responsive height */}
        <div className="relative w-full h-72 sm:h-80 md:h-96">
          <canvas ref={canvasRef} id="weatherChartCanvas" />
        </div>
      </div>
    </section>
  );
};
