import React, { useState } from 'react';
import { MapPin, Landmark, Compass, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { CityInfo } from '../types';

interface CityLandmarkCardProps {
  city: CityInfo;
}

export const CityLandmarkCard: React.FC<CityLandmarkCardProps> = ({ city }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [city.id, city.image]);

  // Fallback image in case network or external url fails
  const fallbackImage = 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop';

  return (
    <div 
      id="city-landmark" 
      className="relative group overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-slate-900 transition-all duration-300"
    >
      {/* Container aspect ratio */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] overflow-hidden">
        
        {/* Loading skeleton placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center text-slate-500">
            <ImageIcon className="w-8 h-8 animate-bounce opacity-40" />
          </div>
        )}

        {/* City Image with Zoom-on-Hover Effect and Object-Fit Cover */}
        <img
          key={city.id} // Forces clean re-render / fade when city changes
          src={imageError ? fallbackImage : city.image}
          alt={`${city.name} - ${city.landmark}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-all duration-700 ease-out ${
            imageLoaded ? 'opacity-100 filter-none' : 'opacity-0'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Multi-layered gradient overlay for pristine contrast and depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Iconic City Landmark</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs font-mono">
            <Compass className="w-3 h-3 text-sky-400" />
            <span>{city.region} India</span>
          </div>
        </div>

        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-3 z-10">
          
          {/* City State header */}
          <div className="flex items-center gap-2 text-sky-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{city.name}, {city.state}</span>
            {city.hindiName && (
              <span className="text-white/60 font-normal">| {city.hindiName}</span>
            )}
          </div>

          {/* Landmark Name in bold display font */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {city.landmark}
          </h2>

          {/* Curated Description */}
          <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-3xl drop-shadow line-clamp-3 sm:line-clamp-none font-normal">
            {city.landmarkDesc}
          </p>

          {/* Coordinates Tag & Explore link */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300/80 border-t border-white/15">
            <span className="font-mono">
              Coordinates: {city.lat.toFixed(4)}°N, {city.lon.toFixed(4)}°E
            </span>
            <span className="flex items-center gap-1 text-sky-300 font-medium group-hover:text-sky-200 transition-colors">
              <span>Interactive Meteorological Anchor</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
