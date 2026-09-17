import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAI(): OpenAI | null {
  if (!isOpenAIConfigured()) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 2 });
  return client;
}

const reasoningModel = /^(gpt-5|o\d)/.test(OPENAI_MODEL);

export function modelOptions(effort: "minimal" | "low" | "medium", maxTokens: number) {
  return reasoningModel
    ? { model: OPENAI_MODEL, max_completion_tokens: maxTokens, reasoning_effort: effort }
    : { model: OPENAI_MODEL, max_completion_tokens: maxTokens };
}

export function describeAIError(error: unknown): string {
  if (error instanceof OpenAI.RateLimitError) {
    return /credit|quota|billing/i.test(error.message)
      ? "The OpenAI account has run out of credit. Showing rule-based guidance instead."
      : "The AI service is busy. Showing rule-based guidance instead.";
  }
  if (error instanceof OpenAI.AuthenticationError) return "The OpenAI API key is invalid. Showing rule-based guidance instead.";
  if (error instanceof OpenAI.APIConnectionError) return "Could not reach the AI service. Showing rule-based guidance instead.";
  if (error instanceof OpenAI.APIError) return "The AI service returned an error. Showing rule-based guidance instead.";
  return "AI guidance is unavailable. Showing rule-based guidance instead.";
}
