import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-opus-5";

let client: Anthropic | null = null;

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getClaude(): Anthropic | null {
  if (!isClaudeConfigured()) return null;
  if (!client) client = new Anthropic();
  return client;
}

export function describeClaudeError(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError) return "The AI service is busy. Showing rule-based guidance instead.";
  if (error instanceof Anthropic.AuthenticationError) return "The AI service key is invalid. Showing rule-based guidance instead.";
  if (error instanceof Anthropic.APIConnectionError) return "Could not reach the AI service. Showing rule-based guidance instead.";
  if (error instanceof Anthropic.APIError) return "The AI service returned an error. Showing rule-based guidance instead.";
  return "AI guidance is unavailable. Showing rule-based guidance instead.";
}
