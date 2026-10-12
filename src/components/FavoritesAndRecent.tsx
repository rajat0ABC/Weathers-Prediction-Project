import React from 'react';
import { Star, History, Trash2, X, MapPin, ArrowRight } from 'lucide-react';
import { CityInfo, TempUnit } from '../types';

interface FavoritesAndRecentProps {
  isOpen: boolean;
  activeTab: 'favorites' | 'history';
  onClose: () => void;
  favorites: CityInfo[];
  recentSearches: string[];
  onSelectCityByName: (name: string) => void;
  onSelectCity: (city: CityInfo) => void;
  onRemoveFavorite: (cityId: string) => void;
  onClearHistory: () => void;
}

export const FavoritesAndRecent: React.FC<FavoritesAndRecentProps> = ({
  isOpen,
  activeTab,
  onClose,
  favorites,
  recentSearches,
  onSelectCityByName,
  onSelectCity,
  onRemoveFavorite,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {activeTab === 'favorites' ? (
              <>
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Favorite Cities ({favorites.length})
                </h3>
              </>
            ) : (
              <>
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recent City Searches
                </h3>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {activeTab === 'favorites' ? (
            favorites.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <Star className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-medium">No saved cities yet.</p>
                <p className="text-xs">Click the &ldquo;Save City&rdquo; star button on any city card to add it to your favorites.</p>
              </div>
            ) : (
              favorites.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 transition-all group"
                >
                  <button
                    onClick={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <img 
                      src={city.image} 
                      alt={city.name} 
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {city.state} &bull; {city.landmark}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => onRemoveFavorite(city.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            recentSearches.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <History className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-medium">No recent searches.</p>
                <p className="text-xs">Searched cities will appear here for fast one-click access.</p>
              </div>
            ) : (
              recentSearches.map((cityName, idx) => (
                <button
                  key={`${cityName}-${idx}`}
                  onClick={() => {
                    onSelectCityByName(cityName);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-slate-800 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-sky-500" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                      {cityName}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transform group-hover:translate-x-1 transition-transform" />
                </button>
              ))
            )
          )}
        </div>

        {/* Footer actions */}
        {activeTab === 'history' && recentSearches.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
