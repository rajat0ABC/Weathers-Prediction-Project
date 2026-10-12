import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// In-memory cache for weather data to prevent excessive third-party API queries and ensure sub-10ms response times
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const weatherCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

// Curated 40+ Indian Cities Data accessible to backend
const INDIAN_CITIES = [
  { id: 'delhi', name: 'Delhi', state: 'National Capital Territory', region: 'North', lat: 28.6139, lon: 77.2090, landmark: 'India Gate' },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab & Haryana', region: 'North', lat: 30.7333, lon: 76.7794, landmark: 'Rock Garden & Sukhna Lake' },
  { id: 'amritsar', name: 'Amritsar', state: 'Punjab', region: 'North', lat: 31.6340, lon: 74.8723, landmark: 'Golden Temple' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', region: 'North', lat: 26.9124, lon: 75.7873, landmark: 'Hawa Mahal' },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', region: 'North', lat: 26.2389, lon: 73.0243, landmark: 'Mehrangarh Fort' },
  { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', region: 'North', lat: 24.5854, lon: 73.7125, landmark: 'City Palace & Lake Pichola' },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', region: 'North', lat: 26.8467, lon: 80.9462, landmark: 'Bara Imambara' },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', region: 'North', lat: 27.1767, lon: 78.0081, landmark: 'Taj Mahal' },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', region: 'North', lat: 25.3176, lon: 82.9739, landmark: 'Ganges River Ghats' },
  { id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', region: 'North', lat: 30.3165, lon: 78.0322, landmark: 'Forest Research Institute' },
  { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', region: 'North', lat: 31.1048, lon: 77.1734, landmark: 'The Ridge & Christ Church' },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', region: 'North', lat: 34.0837, lon: 74.7973, landmark: 'Dal Lake & Houseboats' },
  { id: 'jammu', name: 'Jammu', state: 'Jammu & Kashmir', region: 'North', lat: 32.7266, lon: 74.8570, landmark: 'Bahu Fort & Temple' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', region: 'West', lat: 19.0760, lon: 72.8777, landmark: 'Gateway of India' },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', region: 'West', lat: 18.5204, lon: 73.8567, landmark: 'Shaniwar Wada' },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', region: 'West', lat: 21.1458, lon: 79.0882, landmark: 'Zero Mile Stone & Deekshabhoomi' },
  { id: 'nashik', name: 'Nashik', state: 'Maharashtra', region: 'West', lat: 19.9975, lon: 73.7898, landmark: 'Panchavati & Sula Vineyards' },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', region: 'West', lat: 23.0225, lon: 72.5714, landmark: 'Sabarmati Ashram & Atal Bridge' },
  { id: 'surat', name: 'Surat', state: 'Gujarat', region: 'West', lat: 21.1702, lon: 72.8311, landmark: 'Surat Castle & Tapi Riverfront' },
  { id: 'vadodara', name: 'Vadodara', state: 'Gujarat', region: 'West', lat: 22.3072, lon: 73.1812, landmark: 'Laxmi Vilas Palace' },
  { id: 'rajkot', name: 'Rajkot', state: 'Gujarat', region: 'West', lat: 22.3039, lon: 70.8022, landmark: 'Kaba Gandhi No Delo' },
  { id: 'panaji', name: 'Panaji', state: 'Goa', region: 'West', lat: 15.4909, lon: 73.8278, landmark: 'Our Lady of the Immaculate Conception Church' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', region: 'Central', lat: 22.7196, lon: 75.8577, landmark: 'Rajwada Palace' },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', region: 'Central', lat: 23.2599, lon: 77.4126, landmark: 'Upper Lake (Bhojtal)' },
  { id: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh', region: 'Central', lat: 26.2183, lon: 78.1828, landmark: 'Gwalior Fort & Man Singh Palace' },
  { id: 'jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', region: 'Central', lat: 23.1815, lon: 79.9864, landmark: 'Bhedaghat Marble Rocks' },
  { id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', region: 'Central', lat: 21.2514, lon: 81.6296, landmark: 'Vivekananda Sarovar' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', region: 'East', lat: 22.5726, lon: 88.3639, landmark: 'Howrah Bridge & Victoria Memorial' },
  { id: 'patna', name: 'Patna', state: 'Bihar', region: 'East', lat: 25.5941, lon: 85.1376, landmark: 'Golghar' },
  { id: 'ranchi', name: 'Ranchi', state: 'Jharkhand', region: 'East', lat: 23.3441, lon: 85.3096, landmark: 'Dassam & Hundru Falls' },
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', region: 'East', lat: 20.2961, lon: 85.8245, landmark: 'Lingaraj Temple' },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', region: 'East', lat: 26.1445, lon: 91.7362, landmark: 'Kamakhya Temple & Brahmaputra' },
  { id: 'siliguri', name: 'Siliguri', state: 'West Bengal', region: 'East', lat: 26.7271, lon: 88.3953, landmark: 'Coronation Bridge & Mahananda' },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', region: 'South', lat: 12.9716, lon: 77.5946, landmark: 'Vidhana Soudha' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', region: 'South', lat: 13.0827, lon: 80.2707, landmark: 'Marina Beach & San Thome' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', region: 'South', lat: 17.3850, lon: 78.4867, landmark: 'Charminar' },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', region: 'South', lat: 9.9312, lon: 76.2673, landmark: 'Chinese Fishing Nets' },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', region: 'South', lat: 8.5241, lon: 76.9366, landmark: 'Padmanabhaswamy Temple' },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', region: 'South', lat: 11.0168, lon: 76.9558, landmark: 'Adiyogi Shiva Statue' },
  { id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', region: 'South', lat: 9.9252, lon: 78.1198, landmark: 'Meenakshi Amman Temple' },
  { id: 'mysuru', name: 'Mysuru', state: 'Karnataka', region: 'South', lat: 12.2958, lon: 76.6394, landmark: 'Mysore Palace' },
  { id: 'mangaluru', name: 'Mangaluru', state: 'Karnataka', region: 'South', lat: 12.9141, lon: 74.8560, landmark: 'Panambur Beach' },
  { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', region: 'South', lat: 17.6868, lon: 83.2185, landmark: 'RK Beach & Submarine Museum' },
  { id: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', region: 'South', lat: 16.5062, lon: 80.6480, landmark: 'Kanaka Durga Temple' }
];

const POPULAR_CITY_IDS = ['delhi', 'mumbai', 'bengaluru', 'chennai', 'hyderabad', 'kolkata', 'jaipur', 'indore', 'bhopal'];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // 1. Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      service: 'Weather Prediction India Backend Service',
      version: '1.0.0',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      cachedEntries: weatherCache.size,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Supported Cities endpoint
  app.get('/api/cities', (req, res) => {
    res.json({
      total: INDIAN_CITIES.length,
      cities: INDIAN_CITIES,
    });
  });

  // 3. Weather Proxy & Cache Endpoint
  app.get('/api/weather', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid latitude and longitude query parameters are required.' });
      }

      // Check cache key (rounded to 2 decimal places ~1.1km)
      const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
      const cached = weatherCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return res.json({
          ...cached.data,
          _source: 'server_cache',
          _cacheAgeSeconds: Math.floor((now - cached.timestamp) / 1000),
        });
      }

      // Query Open-Meteo Weather and Air Quality in parallel
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,is_day&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,european_aqi,us_aqi&timezone=auto`;

      const [weatherRes, aqiRes] = await Promise.allSettled([
        fetch(openMeteoUrl),
        fetch(aqiUrl),
      ]);

      if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
        throw new Error('Open-Meteo weather fetch failed');
      }

      const weatherData = await weatherRes.value.json();
      if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
        try {
          weatherData.air_quality = await aqiRes.value.json();
        } catch {
          // Non-blocking
        }
      }

      // Store in memory cache
      weatherCache.set(cacheKey, {
        data: weatherData,
        timestamp: now,
      });

      res.json({
        ...weatherData,
        _source: 'live_open_meteo',
      });
    } catch (err: any) {
      console.error('Error fetching weather data from server:', err);
      res.status(500).json({
        error: 'Failed to retrieve meteorological data',
        message: err.message,
      });
    }
  });

  // 4. Air Quality Proxy & Cache Endpoint
  app.get('/api/air-quality', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid latitude and longitude query parameters required' });
      }

      const aqiKey = `aqi_${lat.toFixed(2)}_${lon.toFixed(2)}`;
      const cached = weatherCache.get(aqiKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return res.json({
          ...cached.data,
          _source: 'server_cache',
        });
      }

      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,european_aqi,us_aqi&timezone=auto`;
      const response = await fetch(aqiUrl);
      if (!response.ok) {
        throw new Error(`Air Quality API returned status ${response.status}`);
      }

      const aqiData = await response.json();
      weatherCache.set(aqiKey, { data: aqiData, timestamp: now });
      res.json({
        ...aqiData,
        _source: 'live_open_meteo',
      });
    } catch (err: any) {
      console.error('Air quality error:', err);
      res.status(500).json({ error: 'Failed to retrieve air quality data', message: err.message });
    }
  });

  // 5. Geocoding Search Endpoint with Indian priority
  app.get('/api/geocoding', async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }

      // Check local Indian cities first
      const localMatches = INDIAN_CITIES.filter(
        c => c.name.toLowerCase().includes(q.toLowerCase()) || c.state.toLowerCase().includes(q.toLowerCase())
      );

      // Also call Open-Meteo Geocoding
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      let openMeteoResults = [];

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        openMeteoResults = geoData.results || [];
      }

      res.json({
        query: q,
        localMatches,
        openMeteoResults,
      });
    } catch (err: any) {
      console.error('Geocoding error:', err);
      res.status(500).json({ error: 'Geocoding request failed', message: err.message });
    }
  });

  // 5. Bulk Popular Cities Weather Endpoint
  app.get('/api/popular-weather', async (req, res) => {
    try {
      const popularCities = INDIAN_CITIES.filter(c => POPULAR_CITY_IDS.includes(c.id));
      const results: Record<string, any> = {};
      const missingCities: typeof popularCities = [];
      const now = Date.now();

      for (const city of popularCities) {
        const cacheKey = `pop_${city.id}`;
        const cached = weatherCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          results[city.id] = cached.data;
        } else {
          missingCities.push(city);
        }
      }

      if (missingCities.length > 0) {
        const lats = missingCities.map(c => c.lat.toFixed(4)).join(',');
        const lons = missingCities.map(c => c.lon.toFixed(4)).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;

        const r = await fetch(url);
        if (r.ok) {
          const rawData = await r.json();
          const items = Array.isArray(rawData) ? rawData : [rawData];
          items.forEach((item, idx) => {
            const city = missingCities[idx];
            if (city && item?.current) {
              const payload = {
                temperature: item.current.temperature_2m,
                apparentTemperature: item.current.apparent_temperature ?? item.current.temperature_2m,
                weatherCode: item.current.weather_code ?? 0,
                humidity: item.current.relative_humidity_2m ?? 60,
                windSpeed: item.current.wind_speed_10m ?? 10,
                isDay: item.current.is_day === 1,
                time: item.current.time,
              };
              weatherCache.set(`pop_${city.id}`, { data: payload, timestamp: now });
              results[city.id] = payload;
            }
          });
        }
      }

      res.json({
        status: 'ok',
        cities: results,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Popular weather bulk query failed', message: err.message });
    }
  });

  // 5b. All / Multi-City Live Weather Endpoint (supports all 44+ cities or custom IDs)
  app.get('/api/cities-weather', async (req, res) => {
    try {
      const requestedIds = req.query.ids ? (req.query.ids as string).split(',').map(s => s.trim().toLowerCase()) : null;
      const targetCities = requestedIds
        ? INDIAN_CITIES.filter(c => requestedIds.includes(c.id.toLowerCase()))
        : INDIAN_CITIES;

      const results: Record<string, any> = {};
      const missingCities: typeof targetCities = [];
      const now = Date.now();

      for (const city of targetCities) {
        const cacheKey = `city_live_${city.id}`;
        const cached = weatherCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          results[city.id] = cached.data;
        } else {
          missingCities.push(city);
        }
      }

      if (missingCities.length > 0) {
        // Query Open-Meteo in chunks of up to 45 cities per batch
        const chunkSize = 45;
        for (let i = 0; i < missingCities.length; i += chunkSize) {
          const chunk = missingCities.slice(i, i + chunkSize);
          const lats = chunk.map(c => c.lat.toFixed(4)).join(',');
          const lons = chunk.map(c => c.lon.toFixed(4)).join(',');
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;

          const r = await fetch(url);
          if (r.ok) {
            const rawData = await r.json();
            const items = Array.isArray(rawData) ? rawData : [rawData];
            items.forEach((item, idx) => {
              const city = chunk[idx];
              if (city && item?.current) {
                const payload = {
                  cityId: city.id,
                  cityName: city.name,
                  temperature: item.current.temperature_2m,
                  apparentTemperature: item.current.apparent_temperature ?? item.current.temperature_2m,
                  weatherCode: item.current.weather_code ?? 0,
                  humidity: item.current.relative_humidity_2m ?? 60,
                  windSpeed: item.current.wind_speed_10m ?? 10,
                  isDay: item.current.is_day === 1,
                  time: item.current.time,
                };
                weatherCache.set(`city_live_${city.id}`, { data: payload, timestamp: now });
                results[city.id] = payload;
              }
            });
          }
        }
      }

      res.json({
        status: 'ok',
        count: Object.keys(results).length,
        cities: results,
      });
    } catch (err: any) {
      console.error('Failed cities weather query:', err);
      res.status(500).json({ error: 'Cities weather bulk query failed', message: err.message });
    }
  });

  // 6. Server-side Meteorological Prediction Engine
  app.get('/api/prediction-summary', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid lat and lon are required' });
      }

      // Fetch or read from cache
      const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
      let weather = weatherCache.get(cacheKey)?.data;

      if (!weather) {
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const resp = await fetch(openMeteoUrl);
        if (resp.ok) {
          weather = await resp.json();
        }
      }

      const temp = weather?.current?.temperature_2m ?? 30;
      const rh = weather?.current?.relative_humidity_2m ?? 50;
      const pressure = weather?.current?.surface_pressure ?? 1012;
      const windSpeed = weather?.current?.wind_speed_10m ?? 12;

      // Magnus-Tetens formula for Dew Point
      const a = 17.27;
      const b = 237.7;
      const alpha = ((a * temp) / (b + temp)) + Math.log(rh / 100);
      const dewPoint = Math.round(((b * alpha) / (a - alpha)) * 10) / 10;

      // Heat Index estimation
      let heatIndex = temp;
      if (temp >= 27 && rh >= 40) {
        heatIndex = Math.round(
          (-8.78469475556 + 1.61139411 * temp + 2.33854883889 * rh - 0.14611605 * temp * rh - 0.012308094 * temp * temp - 0.0164248277778 * rh * rh + 0.002211732 * temp * temp * rh + 0.00072546 * temp * rh * rh - 0.000003582 * temp * temp * rh * rh) * 10
        ) / 10;
      }

      // Indian Meteorological Department (IMD) classification rule
      let imdClassification = 'Normal Seasonal Conditions';
      if (temp >= 40 && (heatIndex - temp >= 5 || temp >= 45)) {
        imdClassification = 'Heatwave Warning (IMD Criterion)';
      } else if (rh >= 80 && temp >= 32) {
        imdClassification = 'Humid Discomfort & Heavy Convection Alert';
      } else if (windSpeed >= 30) {
        imdClassification = 'Squall & Strong Surface Wind Advisory';
      }

      res.json({
        dewPointCelsius: dewPoint,
        heatIndexCelsius: heatIndex,
        barometricPressureHpa: pressure,
        imdClassification,
        disclaimer: 'Weather predictions are estimates and may change as new weather information becomes available.',
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Prediction engine error', message: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server successfully running on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
