import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from '../utils/leafletConfig';
import { 
  Map as MapIcon, 
  Navigation, 
  MapPin, 
  RotateCcw, 
  LocateFixed, 
  Layers, 
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Radio,
  Thermometer
} from 'lucide-react';
import { CityInfo, TempUnit, ThemeMode, CityLiveWeather } from '../types';
import { INDIAN_CITIES } from '../data/cities';
import { fetchBatchCitiesWeather, formatTemperature } from '../services/weatherService';

interface IndiaWeatherMapProps {
  currentCity: CityInfo;
  onSelectCity: (city: CityInfo) => void;
  unit: TempUnit;
  theme: ThemeMode;
}

type RegionFilter = 'All' | 'North' | 'South' | 'West' | 'East' | 'Central';

const REGIONS: { id: RegionFilter; label: string; center?: [number, number]; zoom?: number }[] = [
  { id: 'All', label: 'All India (40+)', center: [22.5, 78.9], zoom: 5 },
  { id: 'North', label: 'North', center: [29.5, 76.5], zoom: 6 },
  { id: 'South', label: 'South', center: [13.0, 77.5], zoom: 6 },
  { id: 'West', label: 'West', center: [21.5, 73.5], zoom: 6 },
  { id: 'East', label: 'East & NE', center: [24.0, 88.0], zoom: 6 },
  { id: 'Central', label: 'Central', center: [23.2, 79.5], zoom: 6 },
];

function isValidCoord(lat?: number, lon?: number): boolean {
  return typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon);
}

// Color palette for temperature ranges
function getTempPillTheme(tempC: number, isDark: boolean) {
  if (tempC >= 34) {
    return {
      bg: isDark ? '#7c2d12' : '#ea580c',
      border: '#fdba74',
      text: '#ffffff',
      shadow: 'rgba(234, 88, 12, 0.45)',
      category: 'Hot',
    };
  }
  if (tempC >= 26) {
    return {
      bg: isDark ? '#14532d' : '#059669',
      border: '#86efac',
      text: '#ffffff',
      shadow: 'rgba(5, 150, 105, 0.45)',
      category: 'Warm',
    };
  }
  if (tempC >= 18) {
    return {
      bg: isDark ? '#0369a1' : '#0284c7',
      border: '#7dd3fc',
      text: '#ffffff',
      shadow: 'rgba(2, 132, 199, 0.45)',
      category: 'Mild',
    };
  }
  return {
    bg: isDark ? '#312e81' : '#4f46e5',
    border: '#a5b4fc',
    text: '#ffffff',
    shadow: 'rgba(79, 70, 229, 0.45)',
    category: 'Cool',
  };
}

export const IndiaWeatherMap: React.FC<IndiaWeatherMapProps> = ({
  currentCity,
  onSelectCity,
  unit,
  theme,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [activeRegion, setActiveRegion] = useState<RegionFilter>('All');
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [liveWeatherMap, setLiveWeatherMap] = useState<Record<string, CityLiveWeather>>({});
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const isDark = theme === 'dark';

  // Safe coordinates for current city with central India fallback
  const currentLat = isValidCoord(currentCity.lat, currentCity.lon) ? currentCity.lat : 22.5;
  const currentLon = isValidCoord(currentCity.lat, currentCity.lon) ? currentCity.lon : 78.9;

  // Cleanup helper
  const teardownMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch {
        // Safe ignore
      }
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      mapContainerRef.current.innerHTML = '';
    }
    setMapReady(false);
  }, []);

  // Filter cities by selected region
  const displayedCities = useMemo(() => {
    if (activeRegion === 'All') {
      return INDIAN_CITIES;
    }
    return INDIAN_CITIES.filter((c) => c.region === activeRegion);
  }, [activeRegion]);

  // Load live temperatures for all 44+ Indian cities
  const loadLiveStationTemperatures = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      // Query all Indian cities so switching regions doesn't cause pop-in
      const data = await fetchBatchCitiesWeather(INDIAN_CITIES);
      if (data && Object.keys(data).length > 0) {
        setLiveWeatherMap(data);
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load station live temperatures:', err);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // Fetch live weather on mount and auto-refresh every 2 minutes
  useEffect(() => {
    loadLiveStationTemperatures();

    const interval = setInterval(() => {
      loadLiveStationTemperatures();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadLiveStationTemperatures]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    setMapError(null);

    // Clean up previous instance
    teardownMap();

    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    try {
      const map = L.map(container, {
        center: [currentLat, currentLon],
        zoom: 5,
        minZoom: 4,
        maxZoom: 13,
        zoomControl: true,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
      });

      mapInstanceRef.current = map;

      // CartoDB base tiles
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        subdomains: 'abcd',
        maxZoom: 19,
      });
      tileLayer.addTo(map);

      // Dedicated layer group for city markers
      const markersLayer = L.layerGroup();
      markersLayer.addTo(map);
      markersLayerRef.current = markersLayer;

      // ResizeObserver
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (mapInstanceRef.current && (mapInstanceRef.current as any)._loaded) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch {
              // Ignore
            }
          }
        });
        ro.observe(container);
        resizeObserverRef.current = ro;
      }

      setMapReady(true);

      setTimeout(() => {
        if (mapInstanceRef.current && (mapInstanceRef.current as any)._loaded) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

    } catch (err: any) {
      console.error('Error initializing Interactive India Weather Map:', err);
      setMapError(err?.message || 'Failed to initialize Leaflet Map');
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      teardownMap();
    };
  }, [theme, teardownMap]);

  // 2. Render Markers onto the Map whenever cities, region, liveWeather, or active city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer || !mapReady) return;

    markersLayer.clearLayers();

    // Include current city if custom search outside standard list
    const allToRender = [...displayedCities];
    const isCustomCity = !INDIAN_CITIES.some((c) => c.id === currentCity.id || c.name.toLowerCase() === currentCity.name.toLowerCase());
    if (isCustomCity && isValidCoord(currentCity.lat, currentCity.lon)) {
      allToRender.unshift(currentCity);
    }

    allToRender.forEach((city) => {
      if (!isValidCoord(city.lat, city.lon)) return;

      const isSelected = city.id === currentCity.id || city.name.toLowerCase() === currentCity.name.toLowerCase();
      const live = liveWeatherMap[city.id];
      const hasLive = !!live && typeof live.temp === 'number';
      const tempVal = hasLive ? formatTemperature(live.temp, unit) : '--';
      const iconVal = hasLive ? live.icon : '🌤️';
      const condVal = hasLive ? live.condition : 'Checking Live...';
      const tempColor = hasLive ? getTempPillTheme(live.temp, isDark) : {
        bg: isDark ? '#334155' : '#475569',
        border: '#94a3b8',
        text: '#ffffff',
        shadow: 'rgba(0,0,0,0.25)',
        category: 'Live',
      };

      // Custom HTML Marker Icon with LIVE temperature badge
      const customPin = L.divIcon({
        className: 'custom-weather-pin-container',
        html: isSelected
          ? `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <span style="
                position: absolute;
                width: 52px;
                height: 52px;
                border-radius: 50%;
                background: #0284c7;
                opacity: 0.35;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></span>
              <div style="
                position: relative;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 5px 12px;
                background: #0284c7;
                color: #ffffff;
                font-family: inherit;
                font-size: 11px;
                font-weight: 800;
                border: 2px solid #ffffff;
                border-radius: 9999px;
                box-shadow: 0 4px 16px rgba(2, 132, 199, 0.55);
                white-space: nowrap;
                transition: transform 0.15s ease;
              ">
                <span style="font-size: 13px;">📍</span>
                <span>${city.name}</span>
                <span style="
                  padding: 1px 6px;
                  background: rgba(255,255,255,0.25);
                  border-radius: 999px;
                  font-size: 11px;
                  font-weight: 800;
                  letter-spacing: -0.2px;
                ">${tempVal}</span>
                <span style="font-size: 12px;">${iconVal}</span>
              </div>
            </div>
          `
          : `
            <div 
              style="
                position: relative;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 3px 8px;
                background: ${tempColor.bg};
                color: ${tempColor.text};
                border: 1.5px solid ${tempColor.border};
                border-radius: 9999px;
                box-shadow: 0 3px 10px ${tempColor.shadow};
                font-family: inherit;
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
                white-space: nowrap;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
              "
              title="${city.name}: ${tempVal} (${condVal})"
              onmouseover="this.style.transform='scale(1.18) translateY(-2px)'; this.style.zIndex='9999';"
              onmouseout="this.style.transform='scale(1) translateY(0)';"
            >
              <span style="font-size: 11px; line-height: 1;">${iconVal}</span>
              <span style="font-weight: 800; letter-spacing: -0.2px;">${tempVal}</span>
              <span style="font-size: 9px; opacity: 0.9; font-weight: 600;">${city.name}</span>
            </div>
          `,
        iconSize: isSelected ? [160, 48] : [110, 26],
        iconAnchor: isSelected ? [80, 24] : [55, 13],
      });

      const marker = L.marker([city.lat, city.lon], { 
        icon: customPin,
        zIndexOffset: isSelected ? 1500 : 100,
      });

      // Rich interactive popup content with LIVE temperature and meteorological stats
      const popupHtml = `
        <div style="
          font-family: inherit;
          padding: 8px 10px;
          min-width: 230px;
          color: ${isDark ? '#f8fafc' : '#0f172a'};
        ">
          <!-- Header with City Name and Live Indicator -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 16px; font-weight: 800; display: block; line-height: 1.2;">${city.name}</strong>
              <span style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'};">${city.state || 'India'}</span>
            </div>
            <span style="
              font-size: 10px;
              font-weight: 800;
              padding: 3px 8px;
              border-radius: 999px;
              background: ${isSelected ? '#0284c7' : isDark ? '#1e293b' : '#e0f2fe'};
              color: ${isSelected ? '#ffffff' : isDark ? '#7dd3fc' : '#0369a1'};
              border: 1px solid ${isSelected ? '#38bdf8' : isDark ? '#334155' : '#bae6fd'};
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981;"></span>
              LIVE
            </span>
          </div>

          <!-- Hero Live Temperature Banner -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-radius: 12px;
            margin-bottom: 8px;
            background: ${isDark ? '#1e293b' : '#f1f5f9'};
            border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
          ">
            <div>
              <div style="font-size: 24px; font-weight: 900; line-height: 1; color: ${isDark ? '#38bdf8' : '#0284c7'};">
                ${tempVal}
              </div>
              <div style="font-size: 11px; font-weight: 600; color: ${isDark ? '#cbd5e1' : '#475569'}; margin-top: 3px;">
                ${condVal}
              </div>
            </div>
            <div style="font-size: 32px; line-height: 1; user-select: none;">
              ${iconVal}
            </div>
          </div>

          <!-- Live atmospheric micro-metrics -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            font-size: 11px;
            margin-bottom: 10px;
            padding: 6px;
            background: ${isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.8)'};
            border-radius: 8px;
          ">
            <div style="display: flex; align-items: center; gap: 4px; color: ${isDark ? '#94a3b8' : '#64748b'};">
              <span>💧 Humidity:</span>
              <strong style="color: ${isDark ? '#f1f5f9' : '#0f172a'};">${live?.humidity ?? 60}%</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; color: ${isDark ? '#94a3b8' : '#64748b'};">
              <span>💨 Wind:</span>
              <strong style="color: ${isDark ? '#f1f5f9' : '#0f172a'};">${live?.windSpeed ?? 10} km/h</strong>
            </div>
          </div>

          ${city.landmark ? `
            <div style="
              font-size: 11px;
              line-height: 1.35;
              color: ${isDark ? '#cbd5e1' : '#334155'};
              margin-bottom: 10px;
              padding: 6px 8px;
              border-radius: 8px;
              background: ${isDark ? '#1e293b' : '#f8fafc'};
              border: 1px dashed ${isDark ? '#334155' : '#cbd5e1'};
            ">
              🏛️ <em>${city.landmark}</em>
            </div>
          ` : ''}

          <button 
            id="map-btn-${city.id}" 
            style="
              width: 100%;
              padding: 8px 14px;
              background: ${isSelected ? '#10b981' : '#0284c7'};
              color: #ffffff;
              font-size: 12px;
              font-weight: 700;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.18);
              transition: all 0.15s ease;
            "
          >
            ${isSelected ? '✓ Currently Selected' : `Load Forecast for ${city.name} →`}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        autoPan: true,
        autoPanPadding: [30, 30],
      });

      // Clicking marker directly selects the city
      marker.on('click', () => {
        onSelectCity(city);
      });

      // Hook the button inside the popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-btn-${city.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onSelectCity(city);
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersLayer);
    });

  }, [displayedCities, currentCity, mapReady, isDark, onSelectCity, liveWeatherMap, unit]);

  // 3. Smooth Camera Pan to Active City
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && (map as any)._loaded && map.getContainer() && isValidCoord(currentLat, currentLon)) {
      try {
        map.stop();
        map.flyTo([currentLat, currentLon], 7, {
          duration: 1.0,
        });
      } catch {
        // Safe ignore
      }
    }
  }, [currentCity.id, currentLat, currentLon]);

  // Reset to All-India view
  const handleResetIndiaView = () => {
    setActiveRegion('All');
    const map = mapInstanceRef.current;
    if (map && (map as any)._loaded && map.getContainer()) {
      try {
        map.stop();
        map.setView([22.5, 78.9], 5, { animate: true });
      } catch {
        // Safe ignore
      }
    }
  };

  // Focus on active city
  const handleFocusActiveCity = () => {
    const map = mapInstanceRef.current;
    if (map && (map as any)._loaded && map.getContainer() && isValidCoord(currentLat, currentLon)) {
      try {
        map.stop();
        map.flyTo([currentLat, currentLon], 8, { animate: true, duration: 0.8 });
      } catch {
        // Safe ignore
      }
    }
  };

  // Region filter change handler
  const handleRegionSelect = (reg: typeof REGIONS[0]) => {
    setActiveRegion(reg.id);
    const map = mapInstanceRef.current;
    if (map && (map as any)._loaded && map.getContainer() && reg.center && reg.zoom) {
      try {
        map.stop();
        map.flyTo(reg.center, reg.zoom, { animate: true, duration: 0.9 });
      } catch {
        // Safe ignore
      }
    }
  };

  return (
    <section id="weather-map-section" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-xs">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Interactive India Weather Map
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Temperatures (40+ Cities)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Live synoptic map showing real-time temperatures across Indian metropolises • Tap any station to explore
              {lastSyncTime && <span className="ml-1 text-[11px] text-slate-400 font-medium">({lastSyncTime})</span>}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadLiveStationTemperatures()}
            disabled={isLiveLoading}
            title="Refresh live station temperatures"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? 'animate-spin' : ''}`} />
            <span>{isLiveLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            onClick={handleFocusActiveCity}
            title={`Focus on ${currentCity.name}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs cursor-pointer"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Focus {currentCity.name}</span>
          </button>

          <button
            onClick={handleResetIndiaView}
            title="Reset India Center View"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset India</span>
          </button>
        </div>
      </div>

      {/* Region Filter Quick-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1 shrink-0">
          <Layers className="w-3 h-3" /> Region:
        </span>
        {REGIONS.map((reg) => {
          const isCurrent = activeRegion === reg.id;
          return (
            <button
              key={reg.id}
              onClick={() => handleRegionSelect(reg)}
              className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400'
              }`}
            >
              {reg.label}
            </button>
          );
        })}
      </div>

      {/* Main Map Box */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-slate-100 dark:bg-slate-900">
        
        {/* Error Fallback Banner if Map fails */}
        {mapError ? (
          <div className="w-full h-80 sm:h-[450px] flex flex-col items-center justify-center p-6 text-center bg-rose-50/50 dark:bg-rose-950/20">
            <Info className="w-8 h-8 text-rose-500 mb-2" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Weather Map Encountered an Issue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null);
                teardownMap();
                setTimeout(() => setMapReady(false), 50);
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
            >
              Reload Map Component
            </button>
          </div>
        ) : (
          /* Leaflet DOM container */
          <div 
            ref={mapContainerRef} 
            id="indiaLeafletMap"
            className="w-full h-80 sm:h-[450px] md:h-[500px] z-10" 
          />
        )}

        {/* Floating Quick Hint Legend with Temperature Color Scales */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-xs shadow-md">
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            Active: {currentCity.name}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> &lt;20°C
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 20-30°C
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> &gt;30°C
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-[11px] text-slate-400">Click station to select</span>
        </div>

        {/* Floating active city badge in top-right */}
        <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <span className="text-slate-400">Station Focus:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {currentCity.name}, {currentCity.state}
          </span>
          {liveWeatherMap[currentCity.id] && (
            <span className="font-extrabold text-sky-600 dark:text-sky-400 pl-1 border-l border-slate-200 dark:border-slate-700">
              {formatTemperature(liveWeatherMap[currentCity.id].temp, unit)} {liveWeatherMap[currentCity.id].icon}
            </span>
          )}
        </div>

      </div>
    </section>
  );
};
