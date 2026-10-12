export interface CityInfo {
  id: string;
  name: string;
  hindiName?: string;
  state: string;
  region: 'North' | 'West' | 'Central' | 'East' | 'South';
  lat: number;
  lon: number;
  landmark: string;
  landmarkDesc: string;
  image: string;
  popular?: boolean;
}

export interface CityLiveWeather {
  cityId: string;
  cityName: string;
  temp: number; // in Celsius
  apparentTemp?: number;
  weatherCode: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  isDay: boolean;
  time?: string;
}

export interface CurrentWeather {
  temperature: number; // in Celsius
  apparentTemperature: number;
  relativeHumidity: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  surfacePressure: number; // hPa
  visibility: number; // meters
  uvIndex: number;
  cloudCover: number; // percentage
  precipitation: number; // mm
  weatherCode: number;
  weatherDesc: string;
  weatherIcon: string;
  isDay: boolean;
  time: string; // ISO string
}

export interface HourlyForecastItem {
  time: string; // formatted time e.g. "09 AM"
  isoTime: string;
  temp: number;
  apparentTemp?: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherIcon: string;
  weatherDesc: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  dayName: string; // "Mon", "Tue", etc.
  fullDateStr: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  weatherIcon: string;
  weatherDesc: string;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export interface WeatherAlertItem {
  id: string;
  type: string;
  title: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  icon: string;
  recommendation: string;
}

export interface AirQualityData {
  aqi: number; // Indian CPCB AQI value (0-500)
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  color: string;
  dominantPollutant: string;
  pm2_5: number; // μg/m³
  pm10: number; // μg/m³
  no2: number; // μg/m³
  so2: number; // μg/m³
  o3: number; // μg/m³
  co: number; // μg/m³
  healthRecommendation: string;
  sensitiveGroupWarning: string;
}

export type DisasterRiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface HazardZone {
  id: string;
  type: 'flood' | 'landslide' | 'waterlogging';
  name: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  severity: 'moderate' | 'high' | 'severe';
  reason: string;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'fire_station' | 'police';
  lat: number;
  lon: number;
  address: string;
  distanceKm: number;
  phone: string;
  bedsAvailable?: number;
  isHighGround: boolean;
  elevationMeters: number;
}

export interface SafeRoutePlan {
  destinationId: string;
  destinationName: string;
  destinationType: EmergencyFacility['type'];
  distanceKm: number;
  estimatedMinutes: number;
  waypoints: [number, number][]; // coordinates for Leaflet polyline
  avoidedHazardsCount: number;
  safetyRating: '100% High-Ground Safe' | 'Clear Evacuation Corridor' | 'Caution Required';
  elevationGainMeters: number;
  turnByTurnInstructions: string[];
}

export interface DisasterAssessment {
  flood: {
    level: DisasterRiskLevel;
    score: number; // 0-100
    title: string;
    description: string;
    rainAccumulation24h: number; // mm
    runoffRisk: 'Minimal' | 'Moderate' | 'High' | 'Extreme Waterlogging';
    safetyTips: string[];
  };
  rainfall: {
    level: DisasterRiskLevel;
    intensity: 'Light' | 'Moderate' | 'Heavy' | 'Very Heavy' | 'Extremely Heavy / Cloudburst';
    rateMmPerHour: number;
    description: string;
    safetyTips: string[];
  };
  landslide: {
    level: DisasterRiskLevel;
    score: number; // 0-100
    isMountainous: boolean;
    title: string;
    description: string;
    slopeSaturation: number; // percentage
    safetyTips: string[];
  };
  storm: {
    level: DisasterRiskLevel;
    windGustKmh: number;
    title: string;
    description: string;
  };
  ndmaWarningStatus: 'Green (Normal)' | 'Yellow (Watch)' | 'Orange (Alert)' | 'Red (Warning - Take Action)';
  activeHazardZones: HazardZone[];
  emergencyPlaces: EmergencyFacility[];
}

export interface WeatherData {
  city: CityInfo;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  alerts: WeatherAlertItem[];
  aqi?: AirQualityData;
  disasterAssessment?: DisasterAssessment;
  lastUpdated: string;
  cityLocalTime: string;
  cityLocalDate: string;
  timezone: string;
}

export type TempUnit = 'C' | 'F';
export type ThemeMode = 'light' | 'dark';
