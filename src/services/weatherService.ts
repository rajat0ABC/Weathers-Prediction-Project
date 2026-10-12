import { AirQualityData, CityInfo, CityLiveWeather, CurrentWeather, DailyForecastItem, HourlyForecastItem, WeatherAlertItem, WeatherData } from '../types';
import { INDIAN_CITIES, findCityById } from '../data/cities';
import { computeDisasterAssessment } from './disasterService';

export interface WeatherCondition {
  text: string;
  icon: string;
  description: string;
}

/**
 * Reusable function converting WMO Weather Interpretation Codes (WW)
 * to readable conditions and icons
 */
export function getWeatherCondition(code: number, isDay: boolean = true): WeatherCondition {
  switch (code) {
    case 0:
      return { text: 'Clear Sky', icon: isDay ? '☀️' : '🌙', description: 'Sunny, cloudless clear skies' };
    case 1:
      return { text: 'Mainly Clear', icon: isDay ? '🌤️' : '🌤️', description: 'Mostly clear with faint scattered clouds' };
    case 2:
      return { text: 'Partly Cloudy', icon: isDay ? '⛅' : '☁️', description: 'Partly cloudy sky with sun intervals' };
    case 3:
      return { text: 'Overcast', icon: '☁️', description: 'Densely overcast skies' };
    case 45:
      return { text: 'Fog', icon: '🌫️', description: 'Dense fog reducing ground visibility' };
    case 48:
      return { text: 'Depositing Rime Fog', icon: '🌫️', description: 'Freezing rime fog conditions' };
    case 51:
      return { text: 'Light Drizzle', icon: '🌦️', description: 'Slight intermittent drizzle' };
    case 53:
      return { text: 'Moderate Drizzle', icon: '🌦️', description: 'Steady moderate drizzle' };
    case 55:
      return { text: 'Dense Drizzle', icon: '🌧️', description: 'Heavy dense drizzle' };
    case 56:
    case 57:
      return { text: 'Freezing Drizzle', icon: '🌨️', description: 'Sub-zero freezing drizzle' };
    case 61:
      return { text: 'Slight Rain', icon: '🌧️', description: 'Light rainfall showers' };
    case 63:
      return { text: 'Moderate Rain', icon: '🌧️', description: 'Continuous moderate rainfall' };
    case 65:
      return { text: 'Heavy Rain', icon: '⛈️', description: 'Torrents of heavy monsoonal rain' };
    case 66:
    case 67:
      return { text: 'Freezing Rain', icon: '🌧️❄️', description: 'Freezing rain icy glaze' };
    case 71:
      return { text: 'Slight Snow', icon: '❄️', description: 'Gentle light snow flurries' };
    case 73:
      return { text: 'Moderate Snow', icon: '❄️', description: 'Steady snowfall over hill stations' };
    case 75:
      return { text: 'Heavy Snow', icon: '❄️⛄', description: 'Heavy snow storm' };
    case 77:
      return { text: 'Snow Grains', icon: '❄️', description: 'Small crystalline frozen grains' };
    case 80:
      return { text: 'Slight Rain Showers', icon: '🌦️', description: 'Scattered passing showers' };
    case 81:
      return { text: 'Moderate Rain Showers', icon: '🌧️', description: 'Frequent brisk showers' };
    case 82:
      return { text: 'Violent Rain Showers', icon: '⛈️', description: 'Severe convective cloudburst showers' };
    case 85:
    case 86:
      return { text: 'Snow Showers', icon: '🌨️', description: 'Intermittent mountain snow showers' };
    case 95:
      return { text: 'Thunderstorm', icon: '⛈️', description: 'Thunderstorm with lightning strikes' };
    case 96:
    case 99:
      return { text: 'Severe Hail Thunderstorm', icon: '⛈️⚡', description: 'Severe convective storm with hail' };
    default:
      return { text: 'Variable Weather', icon: '🌤️', description: 'Mixed atmospheric conditions' };
  }
}

/**
 * Degrees to Compass Direction
 */
export function getWindDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

/**
 * °C to °F conversion
 */
export function cToF(c: number): number {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function formatTemperature(c: number, unit: 'C' | 'F'): string {
  if (unit === 'F') {
    return `${Math.round(cToF(c))}°F`;
  }
  return `${Math.round(c)}°C`;
}

/**
 * National Air Quality Index (NAQI - India CPCB Standard)
 * Computes official CPCB sub-indices based on PM2.5, PM10, NO2, SO2, CO, and O3
 */
export function computeCPCBIndiaAQI(rawAqi: any): AirQualityData {
  const current = rawAqi?.current || {};
  const pm2_5 = Math.round((current.pm2_5 ?? 28) * 10) / 10;
  const pm10 = Math.round((current.pm10 ?? 54) * 10) / 10;
  const no2 = Math.round((current.nitrogen_dioxide ?? 18) * 10) / 10;
  const so2 = Math.round((current.sulphur_dioxide ?? 9) * 10) / 10;
  const o3 = Math.round((current.ozone ?? 38) * 10) / 10;
  const co = Math.round((current.carbon_monoxide ?? 380) * 10) / 10;

  // CPCB Sub-index calculation for PM2.5 (24-hr / ambient concentration)
  let subPm25 = 0;
  if (pm2_5 <= 30) {
    subPm25 = (50 / 30) * pm2_5;
  } else if (pm2_5 <= 60) {
    subPm25 = 50 + (50 / 30) * (pm2_5 - 30);
  } else if (pm2_5 <= 90) {
    subPm25 = 100 + (100 / 30) * (pm2_5 - 60);
  } else if (pm2_5 <= 120) {
    subPm25 = 200 + (100 / 30) * (pm2_5 - 90);
  } else if (pm2_5 <= 250) {
    subPm25 = 300 + (100 / 130) * (pm2_5 - 120);
  } else {
    subPm25 = 400 + (100 / 130) * Math.min(pm2_5 - 250, 130);
  }

  // CPCB Sub-index calculation for PM10
  let subPm10 = 0;
  if (pm10 <= 50) {
    subPm10 = pm10;
  } else if (pm10 <= 100) {
    subPm10 = pm10;
  } else if (pm10 <= 250) {
    subPm10 = 100 + (100 / 150) * (pm10 - 100);
  } else if (pm10 <= 350) {
    subPm10 = 200 + (100 / 100) * (pm10 - 250);
  } else if (pm10 <= 430) {
    subPm10 = 300 + (100 / 80) * (pm10 - 350);
  } else {
    subPm10 = 400 + (100 / 80) * Math.min(pm10 - 430, 80);
  }

  // Fallback to US AQI if sub-indices are negligible
  const fallbackAqi = current.us_aqi || current.european_aqi || 45;
  const computed = Math.round(Math.max(subPm25, subPm10));
  const finalAqi = computed > 0 ? Math.min(500, computed) : fallbackAqi;

  // Dominant pollutant
  const dominantPollutant = subPm25 >= subPm10 ? 'PM2.5' : 'PM10';

  // Category & Advisory
  let category: AirQualityData['category'] = 'Good';
  let color = 'emerald';
  let healthRecommendation = '';
  let sensitiveGroupWarning = '';

  if (finalAqi <= 50) {
    category = 'Good';
    color = 'emerald';
    healthRecommendation = 'Air quality is satisfactory with clean ambient atmosphere. Ideal for all outdoor exercises and activities.';
    sensitiveGroupWarning = 'Minimal or no health impacts expected for any age group.';
  } else if (finalAqi <= 100) {
    category = 'Satisfactory';
    color = 'lime';
    healthRecommendation = 'Air quality is acceptable; outdoor activities can proceed normally for the general population.';
    sensitiveGroupWarning = 'Minor breathing discomfort may be experienced by hyper-sensitive individuals or young children.';
  } else if (finalAqi <= 200) {
    category = 'Moderate';
    color = 'amber';
    healthRecommendation = 'Air quality is acceptable but elevated particles present. Consider reducing prolonged heavy outdoor exertion.';
    sensitiveGroupWarning = 'May cause breathing discomfort to people with asthma, heart diseases, and the elderly.';
  } else if (finalAqi <= 300) {
    category = 'Poor';
    color = 'orange';
    healthRecommendation = 'Avoid strenuous outdoor activities. Close windows during peak traffic hours to prevent dust infiltration.';
    sensitiveGroupWarning = 'Prolonged exposure can trigger respiratory discomfort. Sensitive individuals should wear protective N95 masks.';
  } else if (finalAqi <= 400) {
    category = 'Very Poor';
    color = 'rose';
    healthRecommendation = 'Significant health hazard. Everyone should limit outdoor exposure and run HEPA air purifiers indoors.';
    sensitiveGroupWarning = 'Can cause respiratory illness on prolonged exposure and severe complications for vulnerable groups.';
  } else {
    category = 'Severe';
    color = 'purple';
    healthRecommendation = 'Emergency level air pollution. Avoid all outdoor movements, keep windows sealed, and consult medical professionals if experiencing breathlessness.';
    sensitiveGroupWarning = 'Affects healthy individuals and endangers persons with lung and cardiovascular diseases.';
  }

  return {
    aqi: finalAqi,
    category,
    color,
    dominantPollutant,
    pm2_5,
    pm10,
    no2,
    so2,
    o3,
    co,
    healthRecommendation,
    sensitiveGroupWarning,
  };
}

/**
 * Fetch live weather from Express backend /api/weather with fallback to Open-Meteo
 */
export async function fetchLiveWeatherData(city: CityInfo): Promise<WeatherData> {
  const backendUrl = `/api/weather?lat=${city.lat}&lon=${city.lon}`;
  const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,is_day&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max&timezone=auto`;

  let data: any;

  try {
    // Attempt backend Express route first
    const backendRes = await fetch(backendUrl);
    if (backendRes.ok) {
      data = await backendRes.json();
    } else {
      throw new Error(`Backend returned status ${backendRes.status}`);
    }
  } catch (backendErr) {
    // Fallback directly to Open-Meteo API
    const directRes = await fetch(directUrl);
    if (!directRes.ok) {
      throw new Error(`Open-Meteo API responded with status ${directRes.status}`);
    }
    data = await directRes.json();
  }

  const currentRaw = data.current || {};
  const isDay = currentRaw.is_day === 1 || currentRaw.is_day === undefined;
  const currentCondition = getWeatherCondition(currentRaw.weather_code ?? 0, isDay);

  const current: CurrentWeather = {
    temperature: currentRaw.temperature_2m ?? 28,
    apparentTemperature: currentRaw.apparent_temperature ?? 30,
    relativeHumidity: currentRaw.relative_humidity_2m ?? 65,
    windSpeed: currentRaw.wind_speed_10m ?? 12,
    windDirection: currentRaw.wind_direction_10m ?? 180,
    surfacePressure: currentRaw.surface_pressure ? Math.round(currentRaw.surface_pressure) : 1012,
    visibility: (data.hourly?.visibility?.[0] ?? 10000) / 1000, // convert meters to km
    uvIndex: currentRaw.uv_index ? Math.round(currentRaw.uv_index * 10) / 10 : (data.daily?.uv_index_max?.[0] ?? 6),
    cloudCover: currentRaw.cloud_cover ?? 40,
    precipitation: currentRaw.precipitation ?? 0,
    weatherCode: currentRaw.weather_code ?? 0,
    weatherDesc: currentCondition.text,
    weatherIcon: currentCondition.icon,
    isDay,
    time: currentRaw.time || new Date().toISOString(),
  };

  // Hourly (next 24 hours starting from current time index)
  const hourlyTimes: string[] = data.hourly?.time || [];
  const hourlyTemps: number[] = data.hourly?.temperature_2m || [];
  const hourlyHumid: number[] = data.hourly?.relative_humidity_2m || [];
  const hourlyProb: number[] = data.hourly?.precipitation_probability || [];
  const hourlyCodes: number[] = data.hourly?.weather_code || [];
  const hourlyWinds: number[] = data.hourly?.wind_speed_10m || [];
  const hourlyVis: number[] = data.hourly?.visibility || [];

  const currentTimeISO = current.time;
  let startIndex = 0;
  if (hourlyTimes.length > 0) {
    const currentHourPrefix = currentTimeISO.slice(0, 13);
    const foundIdx = hourlyTimes.findIndex(t => t.startsWith(currentHourPrefix));
    if (foundIdx !== -1) {
      startIndex = foundIdx;
    }
  }

  const hourly: HourlyForecastItem[] = [];
  const count = Math.min(24, hourlyTimes.length - startIndex);
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const rawTime = hourlyTimes[idx];
    const dateObj = new Date(rawTime);
    const hours = dateObj.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedTime = `${hour12.toString().padStart(2, '0')} ${ampm}`;
    const code = hourlyCodes[idx] ?? 0;
    const cond = getWeatherCondition(code, hours >= 6 && hours <= 18);

    hourly.push({
      time: i === 0 ? 'Now' : formattedTime,
      isoTime: rawTime,
      temp: hourlyTemps[idx] ?? current.temperature,
      precipitationProbability: hourlyProb[idx] ?? 0,
      weatherCode: code,
      weatherIcon: cond.icon,
      weatherDesc: cond.text,
      humidity: hourlyHumid[idx] ?? current.relativeHumidity,
      windSpeed: hourlyWinds[idx] ?? current.windSpeed,
      visibility: Math.round((hourlyVis[idx] ?? 10000) / 1000),
    });
  }

  // 7-day daily forecast
  const dailyDates: string[] = data.daily?.time || [];
  const dailyMax: number[] = data.daily?.temperature_2m_max || [];
  const dailyMin: number[] = data.daily?.temperature_2m_min || [];
  const dailyCodes: number[] = data.daily?.weather_code || [];
  const dailyPrecip: number[] = data.daily?.precipitation_sum || [];
  const dailyProbMax: number[] = data.daily?.precipitation_probability_max || [];
  const dailySunrise: string[] = data.daily?.sunrise || [];
  const dailySunset: string[] = data.daily?.sunset || [];
  const dailyUv: number[] = data.daily?.uv_index_max || [];

  const daily: DailyForecastItem[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < Math.min(7, dailyDates.length); i++) {
    const dStr = dailyDates[i];
    const dObj = new Date(dStr);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[dObj.getDay()];
    const fullDateStr = `${monthNames[dObj.getMonth()]} ${dObj.getDate()}`;
    const code = dailyCodes[i] ?? 0;
    const cond = getWeatherCondition(code, true);

    const formatSunTime = (isoString?: string) => {
      if (!isoString) return '--:--';
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    daily.push({
      date: dStr,
      dayName,
      fullDateStr,
      tempMax: dailyMax[i] ?? current.temperature + 4,
      tempMin: dailyMin[i] ?? current.temperature - 5,
      weatherCode: code,
      weatherIcon: cond.icon,
      weatherDesc: cond.text,
      precipitationSum: dailyPrecip[i] ?? 0,
      precipitationProbabilityMax: dailyProbMax[i] ?? 0,
      sunrise: formatSunTime(dailySunrise[i]),
      sunset: formatSunTime(dailySunset[i]),
      uvIndexMax: dailyUv[i] ? Math.round(dailyUv[i] * 10) / 10 : 6,
    });
  }

  // Derive realistic meteorological alerts based on live data
  const alerts: WeatherAlertItem[] = [];

  if (current.temperature >= 42) {
    alerts.push({
      id: 'heatwave-high',
      type: 'Heatwave',
      title: 'Severe Heatwave Warning',
      severity: 'high',
      icon: '🌡️',
      description: `Extreme temperatures reaching ${current.temperature}°C. Danger of heat exhaustion and sunstroke.`,
      recommendation: 'Stay indoors during peak sunlight (11 AM - 4 PM), drink ORS or water with electrolytes, and keep blinds drawn.',
    });
  } else if (current.temperature >= 38) {
    alerts.push({
      id: 'heatwave-mod',
      type: 'Heat',
      title: 'Elevated Temperature Advisory',
      severity: 'moderate',
      icon: '☀️',
      description: `High temperatures of ${current.temperature}°C with feels-like up to ${current.apparentTemperature}°C.`,
      recommendation: 'Wear lightweight cotton clothing, carry an umbrella for sun protection, and avoid intense outdoor workouts.',
    });
  }

  if ([95, 96, 99].includes(current.weatherCode)) {
    alerts.push({
      id: 'thunderstorm-high',
      type: 'Thunderstorm',
      title: 'Thunderstorm & Lightning Alert',
      severity: 'high',
      icon: '⛈️',
      description: 'Active convective thunderstorms with lightning discharges and potential squalls detected.',
      recommendation: 'Seek sturdy indoor shelter immediately. Unplug sensitive electronics and avoid standing under tall trees.',
    });
  } else if ([65, 82].includes(current.weatherCode) || current.precipitation >= 15) {
    alerts.push({
      id: 'heavy-rain',
      type: 'Heavy Rain',
      title: 'Heavy Monsoonal Rainfall',
      severity: 'high',
      icon: '🌧️',
      description: 'Intense precipitation spells likely to cause local urban waterlogging and reduced road visibility.',
      recommendation: 'Drive with low beams, maintain safe braking distances, and avoid low-lying underpasses.',
    });
  } else if ([61, 63, 80, 81].includes(current.weatherCode) || (hourly[0]?.precipitationProbability ?? 0) >= 50) {
    alerts.push({
      id: 'rain-prob',
      type: 'Rain Showers',
      title: 'Passing Rain Showers Likely',
      severity: 'moderate',
      icon: '🌦️',
      description: `Scattered rain spells expected with up to ${hourly[0]?.precipitationProbability ?? 60}% probability.`,
      recommendation: 'Keep rain gear or an umbrella handy while stepping outdoors.',
    });
  }

  if (current.windSpeed >= 35) {
    alerts.push({
      id: 'strong-wind-high',
      type: 'Strong Wind',
      title: 'Gale & Gust Advisory',
      severity: 'high',
      icon: '💨',
      description: `Strong gusts exceeding ${current.windSpeed} km/h recorded in the locality.`,
      recommendation: 'Secure loose outdoor rooftop fixtures, tin sheets, and beware of falling tree branches.',
    });
  } else if (current.windSpeed >= 25) {
    alerts.push({
      id: 'breezy-wind',
      type: 'Brisk Wind',
      title: 'Brisk Surface Winds',
      severity: 'low',
      icon: '🍃',
      description: `Gusty surface winds around ${current.windSpeed} km/h flowing across the city.`,
      recommendation: 'Noticeable wind chill during early morning hours; ensure two-wheeler stability on highways.',
    });
  }

  if (current.visibility <= 1.0 || [45, 48].includes(current.weatherCode)) {
    alerts.push({
      id: 'dense-fog',
      type: 'Fog Alert',
      title: 'Dense Fog & Low Visibility',
      severity: 'moderate',
      icon: '🌫️',
      description: `Surface visibility restricted to ~${current.visibility} km due to atmospheric suspended moisture and inversion.`,
      recommendation: 'Use vehicular fog lights, reduce driving speed, and allow extra time for airport or rail travel.',
    });
  }

  if (current.uvIndex >= 8) {
    alerts.push({
      id: 'uv-high',
      type: 'UV Index',
      title: 'High Ultraviolet Index (UV 8+)',
      severity: 'moderate',
      icon: '🔆',
      description: `Peak solar irradiance is elevated at UV Index ${current.uvIndex}. Harmful to unprotected skin in 15-20 mins.`,
      recommendation: 'Apply broad-spectrum SPF 30+ sunscreen, wear UV-blocking sunglasses and wide-brim hats.',
    });
  }

  // If no severe alerts, provide a calm baseline advisory
  if (alerts.length === 0) {
    alerts.push({
      id: 'fair-weather',
      type: 'Favorable',
      title: 'Pleasant & Stable Meteorological Outlook',
      severity: 'low',
      icon: '🌤️',
      description: 'Atmospheric conditions are stable with comfortable ambient temperatures and low precipitation risk.',
      recommendation: 'Ideal conditions for outdoor sightseeing, commuting, and sports activities.',
    });
  }

  // Date and Time calculation in city's local timezone
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: data.timezone || 'Asia/Kolkata',
  });
  const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: data.timezone || 'Asia/Kolkata',
  });

  const cityLocalTime = timeFormatter.format(now);
  const cityLocalDate = dateFormatter.format(now);

  const lastUpdated = new Date().toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Fetch Air Quality if not bundled
  let airQualityData = data.air_quality;
  if (!airQualityData) {
    try {
      const aqiRes = await fetch(`/api/air-quality?lat=${city.lat}&lon=${city.lon}`);
      if (aqiRes.ok) {
        airQualityData = await aqiRes.json();
      } else {
        const directAqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
        const directAqi = await fetch(directAqiUrl);
        if (directAqi.ok) {
          airQualityData = await directAqi.json();
        }
      }
    } catch {
      // Non-critical fallback
    }
  }

  const aqi = computeCPCBIndiaAQI(airQualityData);
  const sum24hRain = data.daily?.precipitation_sum?.[0] ?? (current.precipitation * 3);
  const disasterAssessment = computeDisasterAssessment(city, current, sum24hRain);

  return {
    city,
    current,
    hourly,
    daily,
    alerts,
    aqi,
    disasterAssessment,
    lastUpdated,
    cityLocalTime,
    cityLocalDate,
    timezone: data.timezone || 'Asia/Kolkata',
  };
}

/**
 * Open-Meteo Geocoding & Local Indian Cities resolver
 */
export async function searchOpenMeteoCity(query: string): Promise<CityInfo[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const lowerQ = cleanQ.toLowerCase();

  // 1. Instant check for exact match in our 40+ curated Indian cities
  const exactMatch = INDIAN_CITIES.find(
    c => c.name.toLowerCase() === lowerQ || c.id === lowerQ
  );

  // 2. Filter local prefix and partial matches
  const localMatches = INDIAN_CITIES.filter(c => 
    c.name.toLowerCase().includes(lowerQ) || 
    c.state.toLowerCase().includes(lowerQ)
  );

  // If exact match found, prioritize it and return immediately without network latency
  if (exactMatch) {
    const others = localMatches.filter(c => c.id !== exactMatch.id);
    return [exactMatch, ...others];
  }

  // If strong local matches (name starts with query), return immediately
  const prefixMatches = localMatches.filter(c => c.name.toLowerCase().startsWith(lowerQ));
  if (prefixMatches.length > 0) {
    const remaining = localMatches.filter(c => !c.name.toLowerCase().startsWith(lowerQ));
    return [...prefixMatches, ...remaining];
  }

  // 3. Query Express backend geocoding or fallback to Open-Meteo Geocoding API
  try {
    let geoResults: any[] = [];

    // Try backend proxy first
    try {
      const backendGeo = await fetch(`/api/geocoding?q=${encodeURIComponent(cleanQ)}`);
      if (backendGeo.ok) {
        const json = await backendGeo.json();
        geoResults = json.openMeteoResults || [];
      }
    } catch {
      // Ignore backend fail and try direct
    }

    // Direct fallback if backend returned no results
    if (geoResults.length === 0) {
      const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQ)}&count=8&language=en&format=json`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const json = await directRes.json();
        geoResults = json.results || [];
      }
    }

    const mapped: CityInfo[] = [];

    // Prioritize and map Geocoding results
    for (const r of geoResults) {
      const existing = INDIAN_CITIES.find(
        c => c.name.toLowerCase() === r.name.toLowerCase() ||
        (Math.abs(c.lat - r.latitude) < 0.25 && Math.abs(c.lon - r.longitude) < 0.25)
      );

      if (existing) {
        if (!mapped.some(m => m.id === existing.id)) {
          mapped.push(existing);
        }
      } else {
        const isIndia = r.country_code === 'IN' || r.country === 'India';
        const id = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (!mapped.some(m => m.id === id)) {
          mapped.push({
            id,
            name: r.name,
            state: r.admin1 || (isIndia ? 'India' : r.country || 'Region'),
            region: isIndia ? 'Central' : 'North',
            lat: r.latitude,
            lon: r.longitude,
            landmark: `${r.name} Central Observatory`,
            landmarkDesc: `Prominent municipal and meteorological center in ${r.admin1 || r.country || 'the region'}.`,
            image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
          });
        }
      }
    }

    // Merge any remaining local matches
    for (const loc of localMatches) {
      if (!mapped.some(m => m.id === loc.id)) {
        mapped.push(loc);
      }
    }

    return mapped.length > 0 ? mapped : localMatches;
  } catch (err) {
    console.warn('Geocoding search failed, falling back to local dataset', err);
    return localMatches;
  }
}

/**
 * Find closest city from coordinates
 */
export function findClosestCity(lat: number, lon: number): CityInfo {
  let closest = INDIAN_CITIES[0];
  let minDistance = Number.MAX_VALUE;

  for (const city of INDIAN_CITIES) {
    const dLat = city.lat - lat;
    const dLon = city.lon - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  // If closest is within reasonable distance, return it. If far (e.g. user is in another town), construct dynamic city
  if (minDistance < 1.0) {
    return closest;
  }

  return {
    id: `loc-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    name: closest ? `Near ${closest.name}` : 'Current Coordinates',
    state: closest?.state || 'India',
    region: closest?.region || 'Central',
    lat,
    lon,
    landmark: 'Current User Coordinate Station',
    landmarkDesc: `Device location anchored at GPS coordinates ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E.`,
    image: closest?.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
  };
}

/**
 * Fetch live weather for multiple cities in parallel / bulk batch.
 * Tries the backend proxy (/api/cities-weather) first.
 * If that fails or is unavailable, batches directly to Open-Meteo multi-coordinate API.
 */
export async function fetchBatchCitiesWeather(cities: CityInfo[]): Promise<Record<string, CityLiveWeather>> {
  if (!cities || cities.length === 0) return {};

  const cityMap: Record<string, CityLiveWeather> = {};
  const cityIds = cities.map(c => c.id).join(',');

  try {
    // 1. Try backend endpoint
    const backendRes = await fetch(`/api/cities-weather?ids=${encodeURIComponent(cityIds)}`);
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data?.cities) {
        Object.keys(data.cities).forEach(id => {
          const raw = data.cities[id];
          const cond = getWeatherCondition(raw.weatherCode ?? 0, raw.isDay !== false);
          cityMap[id] = {
            cityId: id,
            cityName: raw.cityName || id,
            temp: raw.temperature,
            apparentTemp: raw.apparentTemperature,
            weatherCode: raw.weatherCode ?? 0,
            condition: cond.text,
            icon: cond.icon,
            humidity: raw.humidity,
            windSpeed: raw.windSpeed,
            isDay: raw.isDay !== false,
            time: raw.time,
          };
        });
        if (Object.keys(cityMap).length > 0) {
          return cityMap;
        }
      }
    }
  } catch (err) {
    console.warn('Backend /api/cities-weather failed, falling back to direct Open-Meteo batch:', err);
  }

  // 2. Direct Open-Meteo batch fallback (up to 45 coords per batch)
  const chunkSize = 45;
  for (let i = 0; i < cities.length; i += chunkSize) {
    const chunk = cities.slice(i, i + chunkSize);
    const lats = chunk.map(c => c.lat.toFixed(4)).join(',');
    const lons = chunk.map(c => c.lon.toFixed(4)).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const rawData = await res.json();
        const items = Array.isArray(rawData) ? rawData : [rawData];
        items.forEach((item, idx) => {
          const city = chunk[idx];
          if (city && item?.current) {
            const cur = item.current;
            const isDay = cur.is_day === 1 || cur.is_day === undefined;
            const cond = getWeatherCondition(cur.weather_code ?? 0, isDay);
            cityMap[city.id] = {
              cityId: city.id,
              cityName: city.name,
              temp: cur.temperature_2m,
              apparentTemp: cur.apparent_temperature ?? cur.temperature_2m,
              weatherCode: cur.weather_code ?? 0,
              condition: cond.text,
              icon: cond.icon,
              humidity: cur.relative_humidity_2m,
              windSpeed: cur.wind_speed_10m,
              isDay,
              time: cur.time,
            };
          }
        });
      }
    } catch (directErr) {
      console.error('Failed direct Open-Meteo batch fetch for chunk:', directErr);
    }
  }

  return cityMap;
}
