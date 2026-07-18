import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

/**
 * Returns the centralized Gemini client.
 * Uses lazy initialization to prevent crashes if the API key is missing.
 */
export function getGeminiClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI features will operate in simulated fallback mode.");
    return null;
  }

  try {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiInstance;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

/**
 * Helper to call Gemini text generation with timeout protection and custom configs.
 */
export async function generateAIText(prompt: string, systemInstruction?: string, responseMimeType?: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini AI client is not initialized due to missing API key.");
  }

  // Set up 15-second timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Gemini API call timed out after 15 seconds.")), 15000);
  });

  const apiCallPromise = client.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2, // low temperature for precise operational output
      ...(responseMimeType ? { responseMimeType } : {}),
    },
  });

  const response = await Promise.race([apiCallPromise, timeoutPromise]);
  const text = response.text;
  if (!text) {
    throw new Error("Received empty or undefined response from Gemini AI.");
  }

  return text;
}
