export interface TrendDataPoint {
  date: string;
  score: number;
}

export interface NewsSource {
  title: string;
  url: string;
  sourceName: string;
}

export interface GroundingMetadata {
  web_url?: string;
  map_url?: string;
  location_name?: string;
}

export interface Trend {
  id: string;
  title: string;
  summary: string;
  score: number; // 0-100 impact score
  category: 'Politics' | 'Tech' | 'Business' | 'Lifestyle' | 'Entertainment';
  velocity: 'Rising' | 'Stable' | 'Declining';
  sources: NewsSource[];
  history: TrendDataPoint[];
  reasoning: string; // Why this matters
  location?: string;
  mapQuery?: string; // Query used for maps
}

export interface FilterState {
  country: string;
  date: string;
  category: string;
}

export interface ApiStatus {
  loading: boolean;
  error: string | null;
  step: string; // "Scanning headlines", "Clustering topics", "Analyzing velocity"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}