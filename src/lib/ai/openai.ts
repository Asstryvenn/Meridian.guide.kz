import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

export function getOpenAI(): OpenAI | null {
  if (!isOpenAIConfigured()) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 2 });
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
    return "The OPENAI_API_KEY configured on the server is invalid or unauthorized.";
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
