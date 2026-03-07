import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { FilterState, Trend } from "../types";
import { COUNTRIES, CATEGORIES } from "../constants";

// Models
const MAIN_MODEL = 'gemini-2.5-flash-preview'; // Using Flash Preview for better tool integration and grounding
const MAPS_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const IMAGE_MODEL = 'gemini-2.5-flash-image'; // Changed to Flash Image (unpaid key compatible)

// Initialize default AI (uses env key)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Detects trends by scraping Google Search and clustering results via Gemini.
 */
export const detectTrends = async (filters: FilterState): Promise<Trend[]> => {
  const { country, date, category } = filters;
  
  // Refined search query for better date relevance
  let searchQuery = `news in ${country}`;
  if (category !== 'All') {
    searchQuery = `${category} news in ${country}`;
  }
  // Adding "today" or specific date context
  if (date) {
    searchQuery += ` ${date}`;
  }

  const prompt = `
    You are a Senior Data Journalist. Your task is to identify exactly 5 distinct, high-impact news trends for the date: ${date}.

    STEP 1: SEARCH
    Use the 'googleSearch' tool to search for: "${searchQuery}".
    
    STEP 2: VERIFY & CLUSTER
    - Analyze the search results found by the tool. 
    - Cluster them into 5 major distinct trends.
    - IMPORTANT: You must ONLY use the specific URLs provided in the search results. 
    - Do NOT invent URLs. Do NOT link to generic homepages (like bbc.com or cnn.com) unless it is a specific article.
    - If a trend does not have at least one valid, specific article URL from the search results, discard it or find another trend that does.
    - EXTRACT the exact titles and URLs from the search tool output.

    STEP 3: GENERATE JSON
    Return a strictly formatted JSON array matching the schema below.
    
    CRITICAL RULES:
    - "sources": MUST contain the ACTUAL URLs found in the search tool output. 
    - "summary": MUST be non-empty and descriptive (2-3 sentences).
    - "location": Identify the SPECIFIC city, state, or region if mentioned (e.g., "Shah Alam", "Silicon Valley", "Gaza"). Default to "${country}" ONLY if the event is nationwide or generic.
    - "velocity": Infer from the article timestamps (Rising = <12h old, Stable = <24h old).
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        score: { type: Type.NUMBER },
        category: { type: Type.STRING, enum: ['Politics', 'Tech', 'Business', 'Lifestyle', 'Entertainment'] },
        velocity: { type: Type.STRING, enum: ['Rising', 'Stable', 'Declining'] },
        reasoning: { type: Type.STRING },
        location: { type: Type.STRING },
        sources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              sourceName: { type: Type.STRING },
            }
          }
        },
        history: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              score: { type: Type.NUMBER }
            }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });

    let text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      text = text.substring(firstBracket, lastBracket + 1);
    } else {
      throw new Error("AI did not return a valid JSON array.");
    }

    let trends: Trend[];
    try {
      trends = JSON.parse(text) as Trend[];
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("Failed to parse AI response.");
    }

    if (!Array.isArray(trends)) return [];
    
    return trends.map((t, index) => {
      const safeSummary = (t.summary && t.summary.length > 15) 
        ? t.summary 
        : `News signal detected regarding "${t.title}". Click sources for details.`;

      let validSources: any[] = [];
      if (Array.isArray(t.sources)) {
        validSources = t.sources
          .filter(s => {
             // Basic validation to prevent obvious hallucinations
             if (!s.url) return false;
             if (!s.url.startsWith('http')) return false;
             if (s.url.includes('example.com')) return false;
             if (s.url.includes('source.com')) return false;
             return true;
          }) 
          .map(s => ({
            title: s.title || "Read Article",
            url: s.url,
            sourceName: s.sourceName || new URL(s.url).hostname.replace('www.', '')
          }));
      }

      const safeHistory = (t.history && t.history.length > 0) 
        ? t.history 
        : Array.from({ length: 5 }).map((_, i) => ({
            date: `Day -${4-i}`,
            score: Math.max(10, Math.floor((t.score || 50) * (0.8 + Math.random() * 0.4)))
          }));

      return {
        id: t.id || `trend-${Date.now()}-${index}`,
        title: t.title || "Untitled Signal",
        summary: safeSummary,
        score: typeof t.score === 'number' ? t.score : 50,
        category: t.category || (category === 'All' ? 'Business' : category),
        velocity: t.velocity || 'Stable',
        reasoning: t.reasoning || "Trend detected based on current search volume.",
        location: t.location || filters.country,
        sources: validSources,
        history: safeHistory
      } as Trend;
    });

  } catch (error) {
    console.error("Error detecting trends:", error);
    throw error;
  }
};

/**
 * Maps Grounding: Finds the specific location URI for a trend.
 */
export const getTrendLocation = async (trendTitle: string, country: string): Promise<{uri: string, name: string} | null> => {
  try {
    const prompt = `
      Find the most precise geographic location associated with the event "${trendTitle}" occurring in or related to ${country}.
      
      Instructions:
      1. Identify the specific city, state, building, or landmark.
      2. If it's a general national event, use the capital city or the country name.
      3. Return the location name that would be best for a Google Maps search pin.
    `;
    
    const response = await ai.models.generateContent({
      model: MAPS_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const mapChunk = chunks.find((c: any) => c.web?.uri && c.web?.uri.includes('google.com/maps'));
      if (mapChunk && mapChunk.web) {
        return {
          uri: mapChunk.web.uri,
          name: mapChunk.web.title || trendTitle
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Maps grounding error:", error);
    return null;
  }
};

/**
 * TTS: Generates an audio briefing.
 */
export const generateAudioBriefing = async (text: string): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: `Here is your Trend Pulse briefing. ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
  return audioBuffer;
};

/**
 * NLP Filter: Extracts Country, Date, Category from natural language.
 */
export const parseNaturalLanguageQuery = async (query: string, currentFilters: FilterState): Promise<FilterState> => {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `
    You are a smart filter assistant.
    Current Date: ${today}.
    User Query: "${query}"
    
    Extract the following filters from the query:
    1. Country (Must be one of: ${COUNTRIES.join(', ')}). Default to "${currentFilters.country}".
    2. Category (Must be one of: ${CATEGORIES.join(', ')}). Default to "${currentFilters.category}".
    3. Date (Format YYYY-MM-DD). If user says "tomorrow", "next week", etc., calculate the date based on ${today}. Default to "${currentFilters.date}".

    Return JSON only: { "country": "...", "date": "...", "category": "..." }
  `;

  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          date: { type: Type.STRING },
          category: { type: Type.STRING }
        }
      }
    }
  });

  try {
     return JSON.parse(response.text) as FilterState;
  } catch (e) {
     console.error("Failed to parse NLP query", e);
     return currentFilters;
  }
};

/**
 * Chatbot: Answers user questions.
 */
export const chatWithAnalyst = async (message: string, history: {role: string, text: string}[]) => {
  const chat = ai.chats.create({
    model: MAIN_MODEL,
    config: {
      systemInstruction: "You are a helpful Senior News Analyst for the TrendPulse app. Keep answers concise and professional."
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

/**
 * Image Gen: Generates a news image using gemini-2.5-flash-image.
 * Doesn't require separate paid key selection logic, uses process.env.API_KEY.
 */
export const generateTrendImage = async (trendTitle: string, trendSummary: string): Promise<string> => {
  const prompt = `Create a high-quality, editorial news photography style image representing: "${trendTitle}". Context: ${trendSummary}. No text overlay.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        // imageSize not supported for flash-image
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};


// --- Audio Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}