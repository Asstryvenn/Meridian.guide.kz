import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

export function getOpenAIClient(): OpenAI | null {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}
