import React from 'react';
import { MapPin } from 'lucide-react';

interface TrendMapProps {
  locationName: string;
  trendTitle: string;
}

const TrendMap: React.FC<TrendMapProps> = ({ locationName, trendTitle }) => {
  // Determine if this is a global trend
  const isGlobal = locationName === 'Global' || locationName === 'World';

  // Construct query: prioritize the specific location name combined with the trend context if fuzzy
  // We use the location name primarily.
  const query = encodeURIComponent(locationName || "Global");
  
  // URL Construction:
  // q = query
  // t = map type (m for standard)
  // iwloc = A (opens info window on the marker, effectively "pinning" it)
  // z = zoom. We OMIT z for non-global to let Maps auto-zoom to the specific location/pin.
  // for global, we force z=2 to show the world.
  const mapSrc = `https://maps.google.com/maps?q=${query}&t=m&ie=UTF8&iwloc=A&output=embed${isGlobal ? '&z=2' : ''}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full transition-colors relative group">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <MapPin size={18} className="text-red-500" />
          Origin Location
        </h3>
      </div>
      
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 min-h-[200px]">
        {locationName ? (
           <iframe 
             width="100%" 
             height="100%" 
             src={mapSrc} 
             frameBorder="0" 
             scrolling="no" 
             marginHeight={0} 
             marginWidth={0}
             title={`Map of ${locationName}`}
             className="absolute inset-0 w-full h-full grayscale-[0.1] group-hover:grayscale-0 transition-all duration-500"
             allowFullScreen
           />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            <div className="text-center">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p>Locating origin...</p>
            </div>
          </div>
        )}
        
        {/* Overlay gradient for better integration */}
        <div className="absolute inset-0 pointer-events-none border-inner border-black/5 dark:border-white/5"></div>
      </div>
      
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
         <span className="truncate max-w-[200px] font-medium">{locationName || "Global"}</span>
         <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Live
         </span>
      </div>
    </div>
  );
};

export default TrendMap;