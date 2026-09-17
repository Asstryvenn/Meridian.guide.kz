import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import { zodResponseFormat } from "openai/helpers/zod";
import { ACCEPTED_IMPORT_TYPES, importResultSchema, MAX_IMPORT_BYTES } from "@/lib/ai/import-schema";
import { describeAIError, getOpenAI, modelOptions } from "@/lib/ai/openai";
import { extractFromText } from "@/lib/engine/import";

export const runtime = "nodejs";
export const maxDuration = 60;

const INSTRUCTIONS = `You read documents uploaded by high school students — transcripts, test score reports, certificates, CVs — and extract structured data for their university application profile.

Rules:
- Extract only what the document states. Use null for anything not present. Never guess scores or grades.
- gradingSystem: "gpa4" for a 4.0 GPA, "five_point" for 5-point national systems (Kazakhstan, Russia, CIS), "percent" for percentages, "ib" for IB diplomas, "alevel" for A-Levels.
- gpa holds the overall average in the detected grading system.
- Put every extracurricular, award, competition, olympiad, internship, project or leadership role into activities. Pick the closest category and the level of recognition (school, city, national, international). Keep impact concise and factual.
- fields: intended fields of study only if the document clearly shows them, otherwise an empty list.
- summary: one sentence describing the document in the student's language if obvious, otherwise English.
- warnings: note anything unreadable, expired, ambiguous or that the student should double-check.`;

async function toContentPart(file: File): Promise<ChatCompletionContentPart> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf") {
    return { type: "file", file: { filename: file.name || "document.pdf", file_data: `data:application/pdf;base64,${bytes.toString("base64")}` } };
  }
  if (file.type.startsWith("image/")) {
    return { type: "image_url", image_url: { url: `data:${file.type};base64,${bytes.toString("base64")}`, detail: "high" } };
  }
  return { type: "text", text: bytes.toString("utf8").slice(0, 60_000) };
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Attach a file to import." }, { status: 400 });
  if (!ACCEPTED_IMPORT_TYPES.includes(file.type)) return Response.json({ error: "Upload a PDF, PNG, JPG, WEBP or TXT file." }, { status: 415 });
  if (file.size > MAX_IMPORT_BYTES) return Response.json({ error: "The file is larger than 8 MB." }, { status: 413 });

  const openai = getOpenAI();
  if (!openai) {
    if (file.type === "text/plain") return Response.json({ result: extractFromText(await file.text()), source: "rules" });
    return Response.json({ error: "Reading PDFs and photos needs the OpenAI API key to be configured." }, { status: 503 });
  }

  try {
    const completion = await openai.chat.completions.parse({
      ...modelOptions("low", 6000),
      response_format: zodResponseFormat(importResultSchema, "profile_import"),
      messages: [
        { role: "system", content: INSTRUCTIONS },
        { role: "user", content: [{ type: "text", text: `File name: ${file.name}` }, await toContentPart(file)] },
      ],
    });
    const message = completion.choices[0]?.message;
    if (message?.refusal || !message?.parsed) return Response.json({ error: "The document could not be read. Try a clearer scan or a PDF." }, { status: 422 });
    return Response.json({ result: message.parsed, source: "ai" });
  } catch (error) {
    if (file.type === "text/plain") return Response.json({ result: extractFromText(await file.text()), source: "rules" });
    return Response.json({ error: describeAIError(error).replace(" Showing rule-based guidance instead.", "") }, { status: 502 });
  }
}
