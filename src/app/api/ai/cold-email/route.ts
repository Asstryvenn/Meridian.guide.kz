import { z } from "zod";
import { describeAIError, getOpenAIClient, isOpenAIConfigured, OPENAI_MODEL } from "@/lib/ai/openai";

export const runtime = "nodejs";

const requestSchema = z.object({
  professorName: z.string().min(1),
  professorEmail: z.string().email(),
  professorDepartment: z.string().min(1),
  professorAreas: z.array(z.string()).min(1),
  universityName: z.string().min(1),
  studentName: z.string().min(1),
  studentCountry: z.string().optional().default("Kazakhstan"),
  studentGrade: z.number().optional().default(11),
  studentArchetype: z.string().optional().default("Researcher"),
  studentFields: z.array(z.string()).optional().default([]),
  studentInterests: z.string().optional().default(""),
  outreachGoal: z.enum(["research_internship", "lab_discussion", "independent_study", "paper_inquiry"]).default("research_internship"),
  locale: z.enum(["en", "kk", "ru"]).optional().default("en"),
});

const SYSTEM_PROMPT = `You are an elite academic outreach advisor who crafts exceptionally persuasive, respectful, and concise cold emails from prospective undergraduate researchers/applicants to world-class university professors.

Principles:
1. Grounded & Personal: Explicitly reference the professor's specific research area and department, and connect it with the student's background, archetype, and demonstrated curiosity.
2. Academic Etiquette: Address the professor formally ("Dear Professor [LastName]"). Keep the tone intellectually humble, professional, and razor-sharp.
3. Structure:
   - Subject Line: High-open rate, descriptive (e.g., "Prospective Student / Research Inquiry: [Specific Area] - [Student Name]").
   - Hook: Concise intro stating student's current grade, school/country, and specific admiration for professor's work in [Area].
   - Alignment: How student's archetype, projects, or interests tie directly to the lab's mission.
   - Low-Friction Call-To-Action (CTA): A polite 10-15 minute chat inquiry or request to review recent paper findings; no demanding requests.
   - Professional sign-off.
4. Output Format:
   Return ONLY a valid JSON object matching:
   {
     "subject": "string",
     "body": "string"
   }`;

export async function POST(request: Request) {
  const customKey = request.headers.get("x-openai-key") || null;
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email parameters" }, { status: 400 });
  }

  if (!isOpenAIConfigured(customKey)) {
    return Response.json(
      {
        error: "OPENAI_KEY_MISSING",
        message: "OpenAI API is not configured. Add OPENAI_API_KEY in Vercel Project Settings > Environment Variables or configure your API key in the app.",
      },
      { status: 503 }
    );
  }

  const data = parsed.data;
  const userPrompt = `Generate a personalized cold outreach email with the following details:
- Professor: ${data.professorName}
- Department: ${data.professorDepartment}
- Institution: ${data.universityName}
- Research Specialties: ${data.professorAreas.join(", ")}
- Student Name: ${data.studentName}
- Student Country: ${data.studentCountry}
- Current Grade: Grade ${data.studentGrade}
- Student Archetype: ${data.studentArchetype}
- Fields of Interest: ${data.studentFields.join(", ")}
- Specific Interests / Projects: ${data.studentInterests || "Machine learning, computer systems, and computational methods"}
- Outreach Goal: ${data.outreachGoal.replace(/_/g, " ")}
- Language: English (academic standard)`;

  try {
    const openai = getOpenAIClient(customKey);
    if (!openai) {
      return Response.json({ error: "Unable to initialize OpenAI client" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) {
      return Response.json({ error: "No response received from OpenAI" }, { status: 502 });
    }

    const result = JSON.parse(raw);
    return Response.json({
      subject: result.subject,
      body: result.body,
    });
  } catch (error) {
    return Response.json({ error: describeAIError(error) }, { status: 502 });
  }
}
