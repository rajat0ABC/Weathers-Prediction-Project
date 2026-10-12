import React, { useState, useEffect, useRef } from 'react';
import L from '../utils/leafletConfig';
import { 
  AlertTriangle, 
  Waves, 
  Mountain, 
  Wind, 
  CloudRain, 
  ShieldAlert, 
  Hospital, 
  Home, 
  Flame, 
  Navigation, 
  PhoneCall, 
  CheckCircle2, 
  ExternalLink,
  Info,
  Radio,
  ArrowRight,
  TrendingUp,
  MapPin,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { CityInfo, CurrentWeather, DisasterAssessment, EmergencyFacility, HazardZone, SafeRoutePlan, ThemeMode } from '../types';
import { calculateSafeEvacuationRoute, computeDisasterAssessment } from '../services/disasterService';
import { GoogleEvacuationMap } from './GoogleEvacuationMap';

interface DisasterManagementSectionProps {
  city: CityInfo;
  weather: CurrentWeather;
  assessment?: DisasterAssessment;
  theme: ThemeMode;
}

export const DisasterManagementSection: React.FC<DisasterManagementSectionProps> = ({
  city,
  weather,
  assessment: initialAssessment,
  theme,
}) => {
  // Scenario simulation state: 'live' | 'flood' | 'landslide' | 'cyclone'
  const [activeScenario, setActiveScenario] = useState<'live' | 'flood' | 'landslide' | 'cyclone'>('live');

  // Compute active assessment based on scenario
  const assessment = React.useMemo(() => {
    if (activeScenario === 'live' && initialAssessment) {
      return initialAssessment;
    }
    return computeDisasterAssessment(city, weather, 0, activeScenario === 'live' ? undefined : activeScenario);
  }, [city, weather, initialAssessment, activeScenario]);

  // Selected emergency facility for safe route
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(() => {
    return assessment.emergencyPlaces[0] || null;
  });

  // Facility filter tab: 'all' | 'hospital' | 'shelter' | 'fire_station'
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'hospital' | 'shelter' | 'fire_station'>('all');

  // Map engine selection: 'google' (Google Maps JavaScript API) | 'leaflet' (OpenStreetMap)
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');

  // Computed safe route plan
  const [safeRoute, setSafeRoute] = useState<SafeRoutePlan | null>(null);

  // Dynamic hospital prioritization: when disaster risk is detected, auto-select nearest high-ground hospital
  useEffect(() => {
    const isDisasterRisk =
      assessment.ndmaWarningStatus.includes('Red') ||
      assessment.ndmaWarningStatus.includes('Orange') ||
      assessment.flood.level === 'High' ||
      assessment.flood.level === 'Severe' ||
      assessment.landslide.level === 'High' ||
      assessment.landslide.level === 'Severe';

    if (isDisasterRisk) {
      const safeHosp =
        assessment.emergencyPlaces.find((p) => p.type === 'hospital' && p.isHighGround) ||
        assessment.emergencyPlaces.find((p) => p.type === 'hospital');
      if (safeHosp) {
        setSelectedFacility(safeHosp);
      }
    }
  }, [assessment]);

  // Recalculate safe route when selected facility or hazards change
  useEffect(() => {
    if (selectedFacility) {
      const route = calculateSafeEvacuationRoute(
        [city.lat, city.lon],
        selectedFacility,
        assessment.activeHazardZones
      );
      setSafeRoute(route);
    }
  }, [city, selectedFacility, assessment.activeHazardZones]);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const hazardLayersRef = useRef<L.LayerGroup | null>(null);
  const facilityLayersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const isDark = theme === 'dark';

  // 1. Initialize Leaflet Map once per city / theme change (only when mapEngine is 'leaflet')
  useEffect(() => {
    if (mapEngine !== 'leaflet') {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    const safeLat = typeof city.lat === 'number' && !isNaN(city.lat) ? city.lat : 22.5;
    const safeLon = typeof city.lon === 'number' && !isNaN(city.lon) ? city.lon : 78.9;
    const center: [number, number] = [safeLat, safeLon];
    const map = L.map(container, {
      center,
      zoom: 13,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // CartoDB Tile Layer (Dark or Positron)
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    // User Location Pulse Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-60"></span>
          <div class="relative w-6 h-6 rounded-full bg-sky-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker(center, { icon: userIcon })
      .bindPopup(`
        <div class="p-2 text-slate-800">
          <strong class="text-sm block">Current Position</strong>
          <span class="text-xs text-slate-500">${city.name}, ${city.state}</span>
          <div class="text-[11px] text-sky-600 mt-1 font-semibold">Origin of Safe Evacuation Route</div>
        </div>
      `)
      .addTo(map);

    userMarkerRef.current = userMarker;

    // Layer groups for dynamic hazard zones and facilities
    hazardLayersRef.current = L.layerGroup().addTo(map);
    facilityLayersRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      routePolylineRef.current = null;
      hazardLayersRef.current = null;
      facilityLayersRef.current = null;
      userMarkerRef.current = null;
    };
  }, [city.id, isDark]);

  // 2. Dynamically update Hazards & Facilities on existing map layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(map as any)._loaded || !map.getContainer()) return;

    // Update user marker position
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([city.lat, city.lon]);
    }

    // Update Hazard Zones
    if (hazardLayersRef.current) {
      hazardLayersRef.current.clearLayers();
      assessment.activeHazardZones.forEach((h) => {
        const color = h.type === 'flood' ? '#ef4444' : h.type === 'landslide' ? '#ea580c' : '#f59e0b';
        const circle = L.circle([h.lat, h.lon], {
          color,
          fillColor: color,
          fillOpacity: 0.28,
          weight: 2,
          radius: h.radiusMeters,
        });

        circle.bindPopup(`
          <div class="p-2 text-slate-800 max-w-[200px]">
            <div class="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase">
              <span>⚠️ Hazard Alert</span>
            </div>
            <strong class="text-xs block mt-1">${h.name}</strong>
            <p class="text-[11px] text-slate-600 mt-1">${h.reason}</p>
            <div class="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded mt-1.5 font-semibold">
              Status: Route Diversion Active
            </div>
          </div>
        `);
        hazardLayersRef.current?.addLayer(circle);
      });
    }

    // Update Emergency Facilities
    if (facilityLayersRef.current) {
      facilityLayersRef.current.clearLayers();
      assessment.emergencyPlaces.forEach((f) => {
        const isSelected = selectedFacility?.id === f.id;
        const getSymbol = () => {
          if (f.type === 'hospital') return '🏥';
          if (f.type === 'shelter') return '🛡️';
          if (f.type === 'fire_station') return '🚒';
          return '🏛️';
        };

        const getBg = () => {
          if (f.type === 'hospital') return isSelected ? 'bg-rose-600 ring-4 ring-rose-400/50' : 'bg-rose-500';
          if (f.type === 'shelter') return isSelected ? 'bg-emerald-600 ring-4 ring-emerald-400/50' : 'bg-emerald-500';
          return isSelected ? 'bg-amber-600 ring-4 ring-amber-400/50' : 'bg-amber-500';
        };

        const facilityIcon = L.divIcon({
          className: 'custom-facility-marker',
          html: `
            <div class="w-8 h-8 rounded-xl ${getBg()} border-2 border-white text-white flex items-center justify-center text-sm shadow-xl transition-all duration-300 transform ${isSelected ? 'scale-125' : 'hover:scale-110'}">
              ${getSymbol()}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([f.lat, f.lon], { icon: facilityIcon })
          .on('click', () => {
            setSelectedFacility(f);
          });

        marker.bindPopup(`
          <div class="p-2 text-slate-800">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">${f.type.toUpperCase()}</span>
            <strong class="text-sm block mt-0.5">${f.name}</strong>
            <span class="text-xs text-slate-500 block">${f.address}</span>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="font-bold text-emerald-600">${f.distanceKm} km away</span>
              <span class="text-slate-600">Elev: ${f.elevationMeters}m</span>
            </div>
            <div class="text-[11px] text-sky-600 font-semibold mt-1">Helpline: ${f.phone}</div>
          </div>
        `);

        facilityLayersRef.current?.addLayer(marker);
      });
    }
  }, [city, assessment, selectedFacility]);

  // 3. Update Safe Route Polyline when safeRoute changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(map as any)._loaded || !map.getContainer() || !safeRoute) return;

    if (routePolylineRef.current) {
      try {
        routePolylineRef.current.remove();
      } catch {
        // ignore
      }
      routePolylineRef.current = null;
    }

    // High-visibility green elevated safe route polyline
    const polyline = L.polyline(safeRoute.waypoints, {
      color: '#10b981',
      weight: 5,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routePolylineRef.current = polyline;

    // Smoothly pan & fit bounds around route
    try {
      map.stop();
      map.fitBounds(polyline.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    } catch {
      // ignore
    }
  }, [safeRoute]);

  // Filter facilities
  const filteredFacilities = assessment.emergencyPlaces.filter((f) => {
    if (facilityFilter === 'all') return true;
    return f.type === facilityFilter;
  });

  // NDMA Status badge color
  const getNdmaColor = (status: DisasterAssessment['ndmaWarningStatus']) => {
    if (status.includes('Red')) return 'bg-rose-500 text-white animate-pulse';
    if (status.includes('Orange')) return 'bg-orange-500 text-white';
    if (status.includes('Yellow')) return 'bg-amber-500 text-white';
    return 'bg-emerald-600 text-white';
  };

  const getRiskColor = (level: 'Low' | 'Moderate' | 'High' | 'Severe') => {
    switch (level) {
      case 'Severe': return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'High': return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Moderate': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Low': default: return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <section 
      id="disaster-section" 
      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 transition-all"
    >
      {/* Header bar with NDMA alert status & Scenario Simulator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Disaster Detection & Safe Route Guidance</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Early warning for floods, cloudbursts, & landslides with flood-avoiding evacuation routing for <strong>{city.name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* NDMA Alert & Simulator Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[11px]">NDMA Status:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold shadow-xs ${getNdmaColor(assessment.ndmaWarningStatus)}`}>
              {assessment.ndmaWarningStatus}
            </span>
          </div>

          {/* Interactive Scenario Simulator */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveScenario('live')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeScenario === 'live'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🟢 Live Weather
            </button>
            <button
              type="button"
              onClick={() => setActiveScenario('flood')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeScenario === 'flood'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              🌊 Flood Test
            </button>
            <button
              type="button"
              onClick={() => setActiveScenario('landslide')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeScenario === 'landslide'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              ⛰️ Landslide Test
            </button>
          </div>
        </div>
      </div>

      {/* 4 Threat Detection Cards: Flood, Rainfall, Landslide, Wind */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Flood Detection */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
              <Waves className="w-4 h-4 text-sky-500" />
              <span>Flood & Inundation</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRiskColor(assessment.flood.level)}`}>
              {assessment.flood.level} Risk
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{assessment.flood.title}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{assessment.flood.description}</p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>24h Rain: <strong>{assessment.flood.rainAccumulation24h} mm</strong></span>
            <span>Runoff: <strong className="text-slate-700 dark:text-slate-200">{assessment.flood.runoffRisk}</strong></span>
          </div>
        </div>

        {/* Rainfall Intensity */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span>Rainfall Intensity</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRiskColor(assessment.rainfall.level)}`}>
              {assessment.rainfall.intensity}
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">IMD Classification</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{assessment.rainfall.description}</p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Current Rate: <strong>{assessment.rainfall.rateMmPerHour} mm/h</strong></span>
            <span>Cloudburst Alert: <strong>{assessment.rainfall.rateMmPerHour >= 50 ? 'ACTIVE' : 'None'}</strong></span>
          </div>
        </div>

        {/* Landslide Threat */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
              <Mountain className="w-4 h-4 text-amber-500" />
              <span>Landslide & Slopes</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRiskColor(assessment.landslide.level)}`}>
              {assessment.landslide.level} Risk
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{assessment.landslide.title}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{assessment.landslide.description}</p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Soil Saturation: <strong>{assessment.landslide.slopeSaturation}%</strong></span>
            <span>Terrain: <strong>{assessment.landslide.isMountainous ? 'Hilly / Escarpment' : 'Plateau / Plains'}</strong></span>
          </div>
        </div>

        {/* Storm & Squall */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
              <Wind className="w-4 h-4 text-indigo-500" />
              <span>Gale & Cyclone</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRiskColor(assessment.storm.level)}`}>
              {assessment.storm.level} Risk
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{assessment.storm.title}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{assessment.storm.description}</p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Max Gust: <strong>{assessment.storm.windGustKmh} km/h</strong></span>
            <span>Squall Warning: <strong>{assessment.storm.windGustKmh >= 60 ? 'HIGH' : 'Normal'}</strong></span>
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Evacuation Map & Safe Route Director */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Evacuation Map (Google Maps / Leaflet) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-emerald-500" />
                Live Evacuation Path & Hazard Map
              </span>
              <span className="text-slate-400 hidden sm:inline">· Real-Time Route Engine</span>
            </div>

            {/* Map Engine Switcher: Google Maps Platform vs Leaflet */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMapEngine('google')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  mapEngine === 'google'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🗺️ Google Maps</span>
              </button>
              <button
                type="button"
                onClick={() => setMapEngine('leaflet')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  mapEngine === 'leaflet'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>CartoDB</span>
              </button>
            </div>
          </div>

          {/* Quick Route Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nearest =
                    assessment.emergencyPlaces.find((p) => p.type === 'hospital' && p.isHighGround) ||
                    assessment.emergencyPlaces.find((p) => p.type === 'hospital');
                  if (nearest) setSelectedFacility(nearest);
                }}
                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Hospital className="w-3 h-3 text-rose-500" />
                <span>Auto-Route Nearest Hospital</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const shelter = assessment.emergencyPlaces.find((p) => p.type === 'shelter');
                  if (shelter) setSelectedFacility(shelter);
                }}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Home className="w-3 h-3 text-emerald-500" />
                <span>Safe Shelter Base</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block"></span> Safe Path
              </span>
              <span className="flex items-center gap-1 text-rose-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span> Hazard Zone
              </span>
            </div>
          </div>

          {/* Map Rendering Container */}
          {mapEngine === 'google' ? (
            <GoogleEvacuationMap
              city={city}
              assessment={assessment}
              selectedFacility={selectedFacility}
              onSelectFacility={(fac) => setSelectedFacility(fac)}
              safeRoute={safeRoute}
              theme={theme}
            />
          ) : (
            <div 
              ref={mapContainerRef}
              className="w-full h-80 sm:h-96 lg:h-[480px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative z-10"
              style={{ minHeight: '340px' }}
            />
          )}

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
            <span>Click any emergency hospital pin to recalculate real-time safe route</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Avoided {safeRoute?.avoidedHazardsCount || 1} submerged culvert / inundation zones · +{safeRoute?.elevationGainMeters || 14}m elevation
            </span>
          </div>
        </div>

        {/* Right Column: Safe Route Guidance & Emergency Facilities List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Safe Route Highlight Card */}
          {safeRoute && selectedFacility && (
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                    Recommended Evacuation Corridor
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {safeRoute.destinationName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedFacility.address}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white flex-shrink-0">
                  {safeRoute.safetyRating}
                </span>
              </div>

              {/* Transit Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Distance</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{safeRoute.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Est. Transit</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{safeRoute.estimatedMinutes} mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Elevation Gain</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">+{safeRoute.elevationGainMeters} m</span>
                </div>
              </div>

              {/* Turn-by-Turn Guidance */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  High-Ground Safe Turn Guidance:
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  {safeRoute.turnByTurnInstructions.slice(0, 3).map((instr, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{instr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Direct Emergency Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-emerald-500/20">
                <a
                  href={`tel:${selectedFacility.phone.split('/')[0].replace(/[^0-9]/g, '')}`}
                  className="flex-1 min-w-[140px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {selectedFacility.phone.split('/')[0].trim()}</span>
                </a>
                
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Turn-by-Turn GPS</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <a
                  href="tel:112"
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition-colors"
                  title="National Emergency Helpline"
                >
                  <span>SOS 112</span>
                </a>
              </div>
            </div>
          )}

          {/* Directory of Emergency Facilities Near Me */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Emergency Places Near {city.name}
              </h4>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFacilityFilter('all')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${facilityFilter === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityFilter('hospital')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${facilityFilter === 'hospital' ? 'bg-sky-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  Hospitals
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityFilter('shelter')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${facilityFilter === 'shelter' ? 'bg-sky-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  Shelters
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredFacilities.map((f) => {
                const isSelected = selectedFacility?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFacility(f)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                        f.type === 'hospital' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' :
                        f.type === 'shelter' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}>
                        {f.type === 'hospital' ? '🏥' : f.type === 'shelter' ? '🛡️' : '🚒'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {f.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {f.distanceKm} km away · {f.isHighGround ? 'Elevated Safe Ground' : 'Standard Terrain'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFacility(f);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex-shrink-0 ml-2 ${
                        isSelected
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-600 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Routing' : 'Route'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Disaster Preparedness & Actionable NDMA Protocols */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          National Disaster Management Authority (NDMA) Safety Protocols
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-sky-500" />
              Flood Inundation Protocol
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Never drive into waterlogged culverts. Turn around, don&apos;t drown. Unplug household power mains before rising floodwaters reach electrical sockets.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-amber-500" />
              Landslide Safety Protocol
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Watch for sudden tree tilting or mud trickles on hill cuttings. Move perpendicular to rockfall paths toward designated valley center shelters.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              Emergency Helplines (India)
            </span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>National Emergency Response: <strong className="text-rose-600 font-bold">112</strong></div>
              <div>Ambulance & Medical: <strong className="text-emerald-600 font-bold">108</strong> / 102</div>
              <div>Disaster Management (NDMA): <strong className="text-sky-600 font-bold">1077</strong> / 1070</div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
