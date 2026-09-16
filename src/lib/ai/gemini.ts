import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  modelName: string = "gemini-2.5-flash"
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: systemInstruction
      ? {
          systemInstruction,
        }
      : undefined,
  });

  return response.text || "";
}
