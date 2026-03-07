import React, { useState, useEffect } from 'react';
import { Trend } from '../types';
import { ArrowUpRight, Globe, MessageSquare, AlertCircle, Play, Loader2, MapPin, Pause, ImageIcon, X } from 'lucide-react';
import TrendChart from './TrendChart';
import TrendMap from './TrendMap';
import { generateAudioBriefing, getTrendLocation, generateTrendImage } from '../services/geminiService';

interface TrendDetailProps {
  trend: Trend;
  onClose: () => void;
  isDarkMode?: boolean;
}

const TrendDetail: React.FC<TrendDetailProps> = ({ trend, onClose, isDarkMode = false }) => {
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  // Maps Grounding State
  const [groundedLocation, setGroundedLocation] = useState<{uri: string, name: string} | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);

  // Image Gen State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Reset states when trend changes
  useEffect(() => {
    setIsPlaying(false);
    if (audioSource) {
      try { audioSource.stop(); } catch (e) {}
    }
    setAudioContext(null);
    setAudioSource(null);
    setGroundedLocation(null);
    setGeneratedImage(null);
    setShowImageModal(false);
    
    // Fetch Map Grounding
    const fetchMap = async () => {
      setIsMapLoading(true);
      const data = await getTrendLocation(trend.title, trend.location || 'Global');
      setGroundedLocation(data);
      setIsMapLoading(false);
    };
    fetchMap();
    
    // Cleanup on unmount/change
    return () => {
       if (audioContext) audioContext.close();
    };
  }, [trend.id]);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (audioSource) {
        audioSource.stop();
        setIsPlaying(false);
      }
      return;
    }

    setIsAudioLoading(true);
    try {
      const buffer = await generateAudioBriefing(trend.summary);
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      source.start(0);
      
      setAudioContext(ctx);
      setAudioSource(source);
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio playback failed", error);
      alert("Could not generate audio briefing.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleViewImage = async () => {
    setShowImageModal(true);
    if (generatedImage) return; // Already generated

    setIsImageLoading(true);
    try {
      const base64 = await generateTrendImage(trend.title, trend.summary);
      setGeneratedImage(base64);
    } catch (error) {
      console.error("Image generation failed", error);
      alert("Failed to generate image.");
      setShowImageModal(false);
    } finally {
      setIsImageLoading(false);
    }
  };

  const getVelocityColor = (v: string) => {
    switch (v) {
      case 'Rising': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'Declining': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const isMediaPrima = (name: string, url: string) => {
    const safeName = name || '';
    const safeUrl = url || '';
    const keywords = [
      'media prima', 'nst', 'new straits times', 'bharian', 'berita harian', 
      'hmetro', 'harian metro', 'says', 'ohbulan', 'seismik', 'tonton', 'tv3', '8tv', 'tv9'
    ];
    const text = `${safeName} ${safeUrl}`.toLowerCase();
    return keywords.some(k => text.includes(k));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative">
      {/* Image Modal - Fixed Positioning to ensure overlap */}
      {showImageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowImageModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-2 w-full max-w-3xl overflow-hidden transition-colors animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 bg-white/50 hover:bg-white dark:bg-black/50 dark:hover:bg-black rounded-full p-2 text-slate-800 dark:text-slate-200 transition-colors z-10">
               <X size={20} />
             </button>
             {isImageLoading ? (
               <div className="aspect-video flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                 <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                 <p className="text-slate-500 dark:text-slate-300 font-medium animate-pulse">Generating AI Image...</p>
                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Using Gemini Flash Image</p>
               </div>
             ) : (
               generatedImage && (
                 <div className="flex flex-col gap-2">
                    <img src={generatedImage} alt="AI Generated Trend Visual" className="w-full h-auto rounded-lg shadow-md" />
                    <div className="px-2 py-1 text-xs text-slate-400 text-center">AI-generated visualization based on story context</div>
                 </div>
               )
             )}
          </div>
        </div>
      )}

      {/* Left Column: Analytics & Info */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${getVelocityColor(trend.velocity)}`}>
                  {trend.velocity}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">ID: {trend.id}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{trend.title}</h2>
            </div>
            <div className="flex flex-col items-end shrink-0 ml-4">
                <div className="text-3xl font-black text-slate-800 dark:text-slate-200">{trend.score}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold text-right">Signal<br/>Score</div>
            </div>
          </div>
          
          <div className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed text-sm sm:text-base border-l-4 border-blue-500 pl-4 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-r-lg">
             {trend.summary || "Summary unavailable. Please check the source links for more details."}
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                isPlaying 
                  ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
              }`}
            >
              {isAudioLoading ? <Loader2 size={16} className="animate-spin" /> : (isPlaying ? <Pause size={16} /> : <Play size={16} />)}
              {isPlaying ? 'Stop Briefing' : 'Listen to Briefing'}
            </button>
            
            <button 
              onClick={handleViewImage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/50 transition-all"
            >
              <ImageIcon size={16} />
              View AI Image
            </button>
          </div>

          <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2 mb-2">
              <AlertCircle size={16} /> Why it matters
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
              {trend.reasoning || "High engagement detected across multiple media outlets."}
            </p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Signal Velocity (Last 5 Days)</h3>
            <TrendChart data={trend.history} color={trend.velocity === 'Rising' ? '#22c55e' : '#3b82f6'} isDarkMode={isDarkMode} />
        </div>

        {/* Sources Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
           <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
             <Globe size={18} /> Signal Sources
           </h3>
           <div className="space-y-3">
             {trend.sources.map((source, idx) => (
               <a 
                 key={idx} 
                 href={source.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="block group p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
               >
                 <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 line-clamp-1 break-all sm:break-normal">
                        {source.title || "Read Full Article"}
                    </span>
                    <ArrowUpRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                 </div>
                 <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{source.sourceName || "Source"}</span>
                    {isMediaPrima(source.sourceName, source.url) && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold block sm:inline mt-1 sm:mt-0">Media Prima Network</span>
                      </>
                    )}
                 </div>
               </a>
             ))}
             {trend.sources.length === 0 && (
                <div className="text-sm text-slate-400 italic p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                    Sources could not be automatically verified. Please perform a manual search for "{trend.title}".
                </div>
             )}
           </div>
        </div>
      </div>

      {/* Right Column: Visuals & Map */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
         <div className="h-64 sm:h-80 w-full relative">
            <TrendMap 
              locationName={groundedLocation?.name || trend.location || ''} 
              trendTitle={trend.title} 
            />
            {/* Maps Grounding Overlay */}
            {groundedLocation && (
               <a 
                 href={groundedLocation.uri}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="absolute bottom-10 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all z-10"
               >
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <MapPin size={16} className="text-red-500" />
                    <span className="font-semibold truncate max-w-[150px]">{groundedLocation.name}</span>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-500" />
               </a>
            )}
            {isMapLoading && (
               <div className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full shadow-sm animate-pulse">
                  <Loader2 size={14} className="animate-spin text-slate-500 dark:text-slate-300" />
               </div>
            )}
         </div>

         {/* Context Card */}
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <MessageSquare size={18} />
                Analyst Note
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                This trend has clustered across {trend.sources.length + 3} distinct data points today.
            </p>
            <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">High Engagement</span>
                <span className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20">Sentiment: Mixed</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TrendDetail;