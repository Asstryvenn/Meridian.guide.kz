import { callGemini, isGeminiConfigured } from "./gemini";
import { getOpenAI, modelOptions } from "./openai";

export async function generateText(
  prompt: string,
  systemInstruction: string,
  maxTokens = 2500
): Promise<{ text: string; source: "openai" | "gemini" }> {
  const openai = getOpenAI();
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        ...modelOptions("low", maxTokens),
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
      });
      const text = completion.choices[0]?.message.content?.trim();
      if (text) return { text, source: "openai" };
    } catch (error) {
      if (!isGeminiConfigured()) throw error;
    }
  }

  if (isGeminiConfigured()) {
    const text = await callGemini(prompt, systemInstruction);
    if (text.trim()) return { text, source: "gemini" };
  }

  throw new Error("No AI response is available");
}
