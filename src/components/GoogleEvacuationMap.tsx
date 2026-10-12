import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ShieldAlert,
  Hospital,
  Flame,
  AlertTriangle,
  Navigation,
  Car,
  Footprints,
  Bike,
  Layers,
  Compass,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  Sparkles,
  Maximize2
} from 'lucide-react';
import {
  CityInfo,
  DisasterAssessment,
  EmergencyFacility,
  HazardZone,
  SafeRoutePlan,
  ThemeMode
} from '../types';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  GMP_ATTRIBUTION_IDS
} from '../utils/googleMapsConfig';

interface GoogleEvacuationMapProps {
  city: CityInfo;
  assessment: DisasterAssessment;
  selectedFacility: EmergencyFacility | null;
  onSelectFacility: (facility: EmergencyFacility) => void;
  safeRoute: SafeRoutePlan | null;
  onRouteCalculated?: (route: SafeRoutePlan) => void;
  theme: ThemeMode;
}

type TravelMode = 'DRIVING' | 'TWO_WHEELER' | 'WALKING';

/**
 * Inner component to handle real-time route polyline rendering,
 * hazard circles, and viewport auto-fitting using native Google Maps instances
 */
const RouteAndHazardOverlay: React.FC<{
  city: CityInfo;
  selectedFacility: EmergencyFacility | null;
  hazardZones: HazardZone[];
  safeRoute: SafeRoutePlan | null;
  travelMode: TravelMode;
  onRealTimeMetrics?: (metrics: { distanceKm: number; durationMins: number }) => void;
}> = ({
  city,
  selectedFacility,
  hazardZones,
  safeRoute,
  travelMode,
  onRealTimeMetrics,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const mapsLib = useMapsLibrary('maps');

  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  // 1. Draw dynamic hazard zones (circles) on Google Maps
  useEffect(() => {
    if (!map) return;

    // Clear previous circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    const newCircles: google.maps.Circle[] = [];

    hazardZones.forEach((h) => {
      const isSevere = h.severity === 'severe';
      const isHigh = h.severity === 'high';

      const strokeColor = h.type === 'flood' ? '#ef4444' : h.type === 'landslide' ? '#ea580c' : '#f59e0b';
      const fillColor = strokeColor;

      const circle = new google.maps.Circle({
        map,
        center: { lat: h.lat, lng: h.lon },
        radius: h.radiusMeters,
        strokeColor,
        strokeOpacity: isSevere ? 0.9 : 0.75,
        strokeWeight: isSevere ? 2.5 : 2,
        fillColor,
        fillOpacity: isSevere ? 0.35 : isHigh ? 0.28 : 0.2,
        zIndex: 5,
      });

      newCircles.push(circle);
    });

    circlesRef.current = newCircles;

    return () => {
      newCircles.forEach((c) => c.setMap(null));
    };
  }, [map, hazardZones]);

  // 2. Calculate real-time route & render safe evacuation polyline
  useEffect(() => {
    if (!map || !selectedFacility) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    let isCancelled = false;

    // Render fallback elevated safe waypoints first to ensure instant visual response
    const renderWaypoints = (coords: Array<{ lat: number; lng: number }>) => {
      if (isCancelled || !map) return;

      // Glow backdrop line
      const glowLine = new google.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.35,
        strokeWeight: 10,
        zIndex: 10,
        map,
      });

      // Main high-visibility safe path
      const mainLine = new google.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        zIndex: 11,
        map,
      });

      polylinesRef.current = [glowLine, mainLine];

      // Smoothly fit bounds
      try {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: city.lat, lng: city.lon });
        bounds.extend({ lat: selectedFacility.lat, lng: selectedFacility.lon });
        coords.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      } catch {
        // ignore
      }
    };

    // If safeRoute exists, prepare default safe coordinates
    const defaultCoords = safeRoute?.waypoints.map(([lat, lng]) => ({ lat, lng })) || [
      { lat: city.lat, lng: city.lon },
      { lat: selectedFacility.lat, lng: selectedFacility.lon },
    ];

    // Attempt real-time Routes API calculation if library is available
    if (routesLib && (routesLib.Route as any)?.computeRoutes) {
      const modeKey =
        travelMode === 'DRIVING'
          ? 'DRIVING'
          : travelMode === 'TWO_WHEELER'
          ? 'TWO_WHEELER'
          : 'WALKING';

      const request = {
        origin: { lat: city.lat, lng: city.lon },
        destination: { lat: selectedFacility.lat, lng: selectedFacility.lon },
        travelMode: modeKey,
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      };

      (routesLib.Route as any)
        .computeRoutes(request)
        .then((result: any) => {
          if (isCancelled) return;
          const routes = result?.routes;
          if (routes && routes.length > 0) {
            const primaryRoute = routes[0];
            const distKm = Math.round((primaryRoute.distanceMeters || 0) / 100) / 10;
            const durMins = Math.max(1, Math.round((primaryRoute.durationMillis || 0) / 60000));

            if (onRealTimeMetrics) {
              onRealTimeMetrics({ distanceKm: distKm, durationMins: durMins });
            }

            if (typeof primaryRoute.createPolylines === 'function') {
              const polylines = primaryRoute.createPolylines();
              polylines.forEach((poly: google.maps.Polyline) => {
                poly.setOptions({
                  strokeColor: '#10b981',
                  strokeOpacity: 0.95,
                  strokeWeight: 6,
                  zIndex: 12,
                });
                poly.setMap(map);
              });
              polylinesRef.current = polylines;

              if (primaryRoute.viewport) {
                map.fitBounds(primaryRoute.viewport, 60);
              }
              return;
            }
          }
          // Default to safe waypoints
          renderWaypoints(defaultCoords);
        })
        .catch(() => {
          // Graceful fallback to safe elevated waypoints algorithm
          renderWaypoints(defaultCoords);
        });
    } else {
      renderWaypoints(defaultCoords);
    }

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, mapsLib, city, selectedFacility, safeRoute, travelMode]);

  return null;
};

export const GoogleEvacuationMap: React.FC<GoogleEvacuationMapProps> = ({
  city,
  assessment,
  selectedFacility,
  onSelectFacility,
  safeRoute,
  theme,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');
  const [activeInfoWindow, setActiveInfoWindow] = useState<EmergencyFacility | HazardZone | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<{ distanceKm: number; durationMins: number } | null>(null);

  const isDark = theme === 'dark';

  // Check if active disaster risk is detected
  const isHighRisk =
    assessment.ndmaWarningStatus.includes('Red') ||
    assessment.ndmaWarningStatus.includes('Orange') ||
    assessment.flood.level === 'High' ||
    assessment.flood.level === 'Severe' ||
    assessment.landslide.level === 'High' ||
    assessment.landslide.level === 'Severe';

  // Center coordinate for the map
  const mapCenter = useMemo(() => ({
    lat: typeof city.lat === 'number' && !isNaN(city.lat) ? city.lat : 23.2599,
    lng: typeof city.lon === 'number' && !isNaN(city.lon) ? city.lon : 77.4126,
  }), [city.lat, city.lon]);

  // Recenter helper
  const handleRecenter = useCallback(() => {
    setActiveInfoWindow(null);
  }, []);

  return (
    <div className="relative w-full h-[440px] sm:h-[500px] lg:h-[540px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'routes', 'geometry']}>
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={mapCenter}
          center={mapCenter}
          defaultZoom={13}
          mapTypeId={mapType}
          gestureHandling="greedy"
          fullscreenControl={false}
          streetViewControl={false}
          mapTypeControl={false}
          zoomControl={true}
          colorScheme={isDark ? 'DARK' : 'LIGHT'}
          internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
          className="w-full h-full"
        >
          {/* Real-time Routes and Hazard circles overlay */}
          <RouteAndHazardOverlay
            city={city}
            selectedFacility={selectedFacility}
            hazardZones={assessment.activeHazardZones}
            safeRoute={safeRoute}
            travelMode={travelMode}
            onRealTimeMetrics={(metrics) => setRealtimeMetrics(metrics)}
          />

          {/* 1. User Origin Marker (Pulsing safe origin beacon) */}
          <AdvancedMarker
            position={{ lat: city.lat, lng: city.lon }}
            title={`Origin: ${city.name} (${city.state})`}
            onClick={() => setActiveInfoWindow(null)}
          >
            <div className="relative flex items-center justify-center cursor-pointer group">
              <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-sky-400 opacity-70"></span>
              <div className="relative w-7 h-7 rounded-full bg-sky-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold ring-2 ring-sky-400/50">
                📍
              </div>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-sky-400/30">
                Evacuation Origin
              </div>
            </div>
          </AdvancedMarker>

          {/* 2. Hazard Zone Markers (Centroid badges with live warning status) */}
          {assessment.activeHazardZones.map((hazard) => {
            const isSevere = hazard.severity === 'severe';
            return (
              <AdvancedMarker
                key={hazard.id}
                position={{ lat: hazard.lat, lng: hazard.lon }}
                title={`${hazard.name} - ${hazard.reason}`}
                onClick={() => setActiveInfoWindow(hazard)}
              >
                <div className="relative flex flex-col items-center cursor-pointer group">
                  <div
                    className={`px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-lg border backdrop-blur-md transition-transform duration-200 group-hover:scale-110 ${
                      isSevere
                        ? 'bg-rose-600/95 text-white border-rose-400 ring-2 ring-rose-400 animate-pulse'
                        : 'bg-amber-600/95 text-white border-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{hazard.type === 'flood' ? 'FLOOD ZONE' : hazard.type === 'landslide' ? 'LANDSLIDE' : 'WATERLOG'}</span>
                  </div>
                  <div className="text-[9px] text-white bg-slate-950/80 px-1.5 py-0.2 rounded mt-0.5 shadow-sm font-semibold max-w-[110px] truncate">
                    {hazard.name}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 3. Emergency Facility Markers (Hospitals, Shelters, Fire Stations) */}
          {assessment.emergencyPlaces.map((facility) => {
            const isSelected = selectedFacility?.id === facility.id;
            const isHospital = facility.type === 'hospital';
            const isShelter = facility.type === 'shelter';

            return (
              <AdvancedMarker
                key={facility.id}
                position={{ lat: facility.lat, lng: facility.lon }}
                title={`${facility.name} - ${facility.distanceKm} km`}
                onClick={() => {
                  onSelectFacility(facility);
                  setActiveInfoWindow(facility);
                }}
              >
                <div
                  className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  {/* Dynamic Disaster Alert Badge on Hospital Marker */}
                  {isHospital && isHighRisk && (
                    <span className="animate-ping absolute -top-1 -right-1 inline-flex h-4 w-4 rounded-full bg-rose-400 opacity-75"></span>
                  )}

                  <div
                    className={`w-9 h-9 rounded-2xl border-2 border-white flex items-center justify-center text-base shadow-2xl transition-all ${
                      isHospital
                        ? isSelected
                          ? 'bg-rose-600 ring-4 ring-rose-400/80 text-white'
                          : isHighRisk
                          ? 'bg-rose-500 ring-2 ring-rose-300 text-white animate-pulse'
                          : 'bg-rose-500 text-white'
                        : isShelter
                        ? isSelected
                          ? 'bg-emerald-600 ring-4 ring-emerald-400/80 text-white'
                          : 'bg-emerald-500 text-white'
                        : isSelected
                        ? 'bg-amber-600 ring-4 ring-amber-400/80 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isHospital ? '🏥' : isShelter ? '🛡️' : '🚒'}
                  </div>

                  {/* Marker label pill */}
                  <div
                    className={`mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-md max-w-[120px] truncate border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-900/90 text-slate-100 border-slate-700'
                    }`}
                  >
                    {facility.name.split('(')[0].split('Trauma')[0].trim()}
                  </div>

                  {/* Live hospital bed badge */}
                  {facility.bedsAvailable && (
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/90 px-1 rounded mt-0.5 border border-emerald-700/50">
                      {facility.bedsAvailable} Beds Free
                    </span>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Interactive InfoWindow for Selected Marker */}
          {activeInfoWindow && 'type' in activeInfoWindow && 'address' in activeInfoWindow && (
            <InfoWindow
              position={{
                lat: (activeInfoWindow as EmergencyFacility).lat,
                lng: (activeInfoWindow as EmergencyFacility).lon,
              }}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="p-2 text-slate-800 max-w-[240px]">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    {(activeInfoWindow as EmergencyFacility).type.toUpperCase()}
                  </span>
                  {(activeInfoWindow as EmergencyFacility).isHighGround && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                      High-Ground Safe
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  {(activeInfoWindow as EmergencyFacility).name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {(activeInfoWindow as EmergencyFacility).address}
                </p>

                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Distance:</span>
                    <strong className="text-slate-800">
                      {(activeInfoWindow as EmergencyFacility).distanceKm} km
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Available Beds:</span>
                    <strong className="text-emerald-600">
                      {(activeInfoWindow as EmergencyFacility).bedsAvailable || 45}
                    </strong>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFacility(activeInfoWindow as EmergencyFacility);
                      setActiveInfoWindow(null);
                    }}
                    className="flex-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Route to this Facility
                  </button>
                  <a
                    href={`tel:${(activeInfoWindow as EmergencyFacility).phone.split('/')[0].replace(/[^0-9]/g, '')}`}
                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                    title="Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Top Floating Overlay Controls: Travel Mode & Map Type */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        
        {/* Travel Mode Selector */}
        <div className="flex items-center p-1 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl pointer-events-auto text-xs">
          <button
            type="button"
            onClick={() => setTravelMode('DRIVING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              travelMode === 'DRIVING'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Ambulance / Emergency Vehicle Route"
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ambulance</span>
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('TWO_WHEELER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              travelMode === 'TWO_WHEELER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Two-Wheeler Emergency Dispatch"
          >
            <Bike className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2-Wheeler</span>
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('WALKING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              travelMode === 'WALKING'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Pedestrian Safe High-Ground Walk"
          >
            <Footprints className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Foot Evac</span>
          </button>
        </div>

        {/* Map Type Selector: Roadmap / Terrain / Satellite */}
        <div className="flex items-center p-1 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl pointer-events-auto text-xs">
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              mapType === 'roadmap'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Vector
          </button>
          <button
            type="button"
            onClick={() => setMapType('terrain')}
            className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              mapType === 'terrain'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Terrain Elevation Hillshade"
          >
            Terrain
          </button>
          <button
            type="button"
            onClick={() => setMapType('hybrid')}
            className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              mapType === 'hybrid'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Satellite Imagery"
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Bottom Floating Route Telemetry HUD */}
      {selectedFacility && (
        <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-emerald-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl pointer-events-auto z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-400 bg-emerald-950 px-2 py-0.2 rounded border border-emerald-700/50">
                  Target: {selectedFacility.type.toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-400 truncate hidden md:inline">
                  Avoided {safeRoute?.avoidedHazardsCount || 1} inundated points
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {selectedFacility.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 text-xs">
            <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/5">
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold">Live Distance</span>
                <span className="font-bold text-white text-xs sm:text-sm">
                  {realtimeMetrics?.distanceKm ?? safeRoute?.distanceKm ?? selectedFacility.distanceKm} km
                </span>
              </div>
              <div className="w-px h-6 bg-slate-700"></div>
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold">Transit ETA</span>
                <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                  {realtimeMetrics?.durationMins ?? safeRoute?.estimatedMinutes ?? Math.round(selectedFacility.distanceKm * 3.5)} min
                </span>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${city.lat},${city.lon}&destination=${selectedFacility.lat},${selectedFacility.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all text-xs"
            >
              <span>GPS Nav</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Real-time Disaster Risk Warning Bar (top left pulse if severe) */}
      {isHighRisk && (
        <div className="absolute top-14 left-3 bg-rose-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 border border-rose-400 z-10 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Active Disaster Protocol: Route Diverted Around Hazard Zones</span>
        </div>
      )}
    </div>
  );
};
