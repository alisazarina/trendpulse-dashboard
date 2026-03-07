export const COUNTRIES = [
  "Malaysia",
  "Singapore",
  "Indonesia",
  "United States",
  "United Kingdom",
  "Global"
];

export const CATEGORIES = [
  "All",
  "Politics",
  "Business",
  "Tech",
  "Entertainment",
  "Lifestyle"
];

// Placeholder for simulated initial data if API fails or for empty state
export const EMPTY_TREND: any = {
  id: '0',
  title: 'Waiting for signal detection...',
  summary: 'Select filters and click "Scan for Trends" to begin.',
  score: 0,
  category: 'Tech',
  velocity: 'Stable',
  sources: [],
  history: [],
  reasoning: ''
};