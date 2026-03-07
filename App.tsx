import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, TrendingUp, Calendar, MapPin, RefreshCw, Radio, Search, MessageSquare, Moon, Sun } from 'lucide-react';
import { detectTrends } from './services/geminiService';
import { Trend, FilterState, ApiStatus } from './types';
import { COUNTRIES, CATEGORIES } from './constants';
import TrendDetail from './components/TrendDetail';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  // --- State Management ---
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    country: 'Malaysia',
    date: new Date().toISOString().split('T')[0], // Default to today
    category: 'All'
  });

  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    loading: false,
    error: null,
    step: ''
  });

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Refs
  const dateInputRef = useRef<HTMLInputElement>(null);
  const detailViewRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auto-scroll to details on mobile when selection changes
  useEffect(() => {
    if (selectedTrendId && window.innerWidth < 768 && detailViewRef.current) {
      detailViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedTrendId]);

  // --- Handlers ---
  const handleScan = async () => {
    setApiStatus({ loading: true, error: null, step: 'Initializing agents...' });
    setSelectedTrendId(null);
    
    // Safety check for date
    const scanFilters = {
      ...filters,
      date: filters.date || new Date().toISOString().split('T')[0]
    };
    
    try {
      // Step 1: Simulated "Scraping" via Search
      setApiStatus(prev => ({ ...prev, step: `Scraping sources in ${scanFilters.country}...` }));
      await new Promise(r => setTimeout(r, 800)); // UX delay for realism

      // Step 2: Clustering
      setApiStatus(prev => ({ ...prev, step: 'Clustering topics using embeddings...' }));
      
      const results = await detectTrends(scanFilters);
      
      setTrends(results);
      if (results.length > 0) {
        setSelectedTrendId(results[0].id);
      }
      setApiStatus({ loading: false, error: null, step: '' });

    } catch (err: any) {
      console.error(err);
      setApiStatus({ 
        loading: false, 
        error: "Failed to detect signals. Please check your network or try again.", 
        step: '' 
      });
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const selectedTrend = trends.find(t => t.id === selectedTrendId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* --- Navbar --- */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <TrendingUp size={20} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">TrendPulse</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider hidden sm:block">Signal Detector v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Operational
             </div>
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle Dark Mode"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Controls Section */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 md:mb-8 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center transition-colors">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Country Filter */}
            <div className="space-y-1 w-full md:w-auto">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Target Region</label>
              <div className="relative">
                <select 
                  className="w-full md:w-48 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                  value={filters.country}
                  onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-1 w-full md:w-auto">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Analysis Date</label>
              <div className="relative">
                <input 
                  ref={dateInputRef}
                  type="date" 
                  className="w-full md:w-48 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                  value={filters.date}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker();
                    } catch (e) {
                      // Ignore
                    }
                  }}
                  style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                />
                <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-1 w-full md:w-auto">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Sector</label>
              <div className="relative">
                <select 
                  className="w-full md:w-48 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-slate-100"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Radio size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleScan}
            disabled={apiStatus.loading}
            className={`
              w-full lg:w-auto flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-md transition-all
              ${apiStatus.loading ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'}
            `}
          >
            {apiStatus.loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search size={18} />
                Scan Signals
              </>
            )}
          </button>
        </div>

        {/* Status / Error Messages */}
        {apiStatus.step && (
          <div className="mb-6 flex justify-center">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold animate-pulse border border-blue-100 dark:border-blue-800 text-center">
               AI Agent: {apiStatus.step}
            </span>
          </div>
        )}
        {apiStatus.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm font-medium border border-red-100 dark:border-red-800 flex items-center gap-2">
            <RefreshCw size={16} className="shrink-0" /> {apiStatus.error}
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          
          {/* Left Sidebar: Trend List */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col h-96 md:h-[600px] lg:h-[700px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Detected Signals</h2>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{trends.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-1">
              {trends.length === 0 && !apiStatus.loading && (
                 <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl h-full flex flex-col justify-center items-center">
                    <LayoutDashboard className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                    <p className="text-sm text-slate-400 dark:text-slate-500">No signals loaded. Start a scan.</p>
                 </div>
              )}

              {trends.map(trend => (
                <div 
                  key={trend.id}
                  onClick={() => setSelectedTrendId(trend.id)}
                  className={`
                    group cursor-pointer p-4 rounded-xl border transition-all duration-200
                    ${selectedTrendId === trend.id 
                      ? 'bg-blue-600 border-blue-600 shadow-md transform scale-[1.02]' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      selectedTrendId === trend.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}>
                      {trend.category}
                    </span>
                    <span className={`text-xs font-bold ${
                      selectedTrendId === trend.id ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {trend.score}/100
                    </span>
                  </div>
                  <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${
                     selectedTrendId === trend.id ? 'text-white' : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  }`}>
                    {trend.title}
                  </h3>
                  <div className={`flex items-center gap-2 mt-2 text-xs ${
                    selectedTrendId === trend.id ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                     <span>{trend.sources.length} sources</span>
                     <span>•</span>
                     <span>{trend.velocity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area: Detail View */}
          <div ref={detailViewRef} className="col-span-12 md:col-span-8 lg:col-span-9">
            {selectedTrend ? (
               <TrendDetail trend={selectedTrend} onClose={() => setSelectedTrendId(null)} isDarkMode={isDarkMode} />
            ) : (
               <div className="min-h-[300px] h-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4">
                     <TrendingUp size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Select a signal to analyze</h3>
                  <p className="text-sm max-w-md text-center mt-2">
                    AI will explain the trend velocity, provide reasoning, and map the geolocation.
                  </p>
               </div>
            )}
          </div>

        </div>
      </main>

      {/* Chatbot Widget */}
      <ChatBot />
    </div>
  );
};

export default App;