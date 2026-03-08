# TrendPulse - Media Signal Detector

TrendPulse is a real-time trend detection dashboard designed for media professionals. It leverages Google's Gemini AI to "scrape" (simulate via search grounding) news sources, cluster emerging topics, and visualize signal velocity and geolocation data.

## TrendPulse Preview
<img width="898" height="920" alt="4-Search2_LightMode" src="https://github.com/user-attachments/assets/10711b12-d05e-4ae3-88c7-e24eed5f3fd4" />

More app demo screenshots shared in the *screenshots* folder.

## 🚀 Features

- **AI-Powered Signal Detection**: Uses Gemini models to analyze current events and identify trending topics.
- **Multi-Region Support**: Filter trends by specific countries (e.g., Malaysia, Singapore, Indonesia, etc.).
- **Sector Analysis**: Drill down into specific categories like Technology, Finance, Politics, and Entertainment.
- **Interactive Visualizations**:
  - **Trend Velocity**: Visual graphs showing the growth of a trend over time.
  - **Geospatial Mapping**: Visual representation of where trends are originating.
- **AI Assistant**: Built-in chatbot to ask specific questions about the detected trends.
- **Dark Mode**: Fully responsive dark/light theme for comfortable viewing in any environment.

## 🛠️ Technical Stack

- **Frontend Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Integration**: [@google/genai](https://www.npmjs.com/package/@google/genai) SDK (Gemini 2.5 Flash)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 📂 Project Structure
```
/
├── components/
│   ├── ChatBot.tsx       # AI assistant interface for querying trends
│   ├── TrendChart.tsx    # Visualization of trend velocity/growth
│   ├── TrendDetail.tsx   # Detailed view of a selected trend
│   └── TrendMap.tsx      # Geospatial representation of trends
├── services/
│   └── geminiService.ts  # Core service for interacting with Gemini API
├── App.tsx               # Main application controller and layout
├── constants.ts          # Static data (Countries, Categories)
├── types.ts              # TypeScript interfaces and type definitions
├── .env                  # Environment variables (API Keys)
└── vite.config.ts        # Vite configuration
```

## 🧠 How It Works

1. **Input Parameters**: The user selects a target region, date, and category.
2. **AI Analysis**: The app sends a prompt to the Gemini model via `geminiService.ts`.
3. **Search Grounding**: The model uses Google Search grounding to fetch real-time information about current events matching the criteria.
4. **Clustering & Synthesis**: The model processes the search results, clusters related stories into "Trends," and assigns metrics like "Velocity" and "Sentiment."
5. **Visualization**: The structured JSON response is parsed and rendered into the dashboard components.

## Disclaimer

This app was built during a company training programme using Google AI Studio, as part of my learning in prompt engineering, generative AI, and front-end development with React and the Gemini API. Please do not copy, redistribute, or republish this app or derivative works without explicit permission.
