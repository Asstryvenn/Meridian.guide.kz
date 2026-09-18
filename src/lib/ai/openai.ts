import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let defaultClient: OpenAI | null = null;

function sanitizeKey(key?: string | null): string | null {
  if (!key) return null;
  const trimmed = key.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 5 ? trimmed : null;
}

export function getOpenAIApiKey(customKey?: string | null): string | null {
  const custom = sanitizeKey(customKey);
  if (custom) return custom;
  const serverKey = sanitizeKey(process.env.OPENAI_API_KEY);
  if (serverKey) return serverKey;
  const publicKey = sanitizeKey(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
  if (publicKey) return publicKey;
  return null;
}

export function isOpenAIConfigured(customKey?: string | null): boolean {
  return Boolean(getOpenAIApiKey(customKey));
}

export function getOpenAI(customKey?: string | null): OpenAI | null {
  const apiKey = getOpenAIApiKey(customKey);
  if (!apiKey) return null;
  if (!customKey && defaultClient) return defaultClient;
  const client = new OpenAI({ apiKey, timeout: 60_000, maxRetries: 2 });
  if (!customKey) defaultClient = client;
  return client;
}

const isReasoningModel = /^(o1|o3)/.test(OPENAI_MODEL);

export function modelOptions(effort: "minimal" | "low" | "medium", maxTokens: number) {
  if (isReasoningModel) {
    return { model: OPENAI_MODEL, max_completion_tokens: maxTokens, reasoning_effort: effort };
  }
  return { model: OPENAI_MODEL, max_completion_tokens: maxTokens };
}

export function describeAIError(error: unknown): string {
  if (error instanceof OpenAI.RateLimitError) {
    return /credit|quota|billing/i.test(error.message)
      ? "OpenAI API quota or credit limit reached. Please check your OpenAI account billing."
      : "OpenAI API rate limit reached. Please retry in a few moments.";
  }
  if (error instanceof OpenAI.AuthenticationError) {
    return "The OPENAI_API_KEY is invalid or unauthorized. Please verify your OpenAI key in Vercel or in app settings.";
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return "Could not connect to OpenAI API server.";
  }
  if (error instanceof OpenAI.APIError) {
    return `OpenAI API Error: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred while communicating with OpenAI.";
}

export const getOpenAIClient = getOpenAI;
