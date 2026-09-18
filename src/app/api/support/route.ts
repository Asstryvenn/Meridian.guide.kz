import { z } from "zod";
import { getSupabase } from "@/lib/supabase/client";

export const runtime = "nodejs";

const supportRequestSchema = z.object({
  type: z.enum(["bug", "ticket", "inquiry"]).default("ticket"),
  email: z.string().email(),
  name: z.string().optional(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function generateTicketId(type: string): string {
  const prefix = type === "bug" ? "BUG" : type === "inquiry" ? "INQ" : "TIC";
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${datePart}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = supportRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const ticketId = generateTicketId(data.type);
    const createdAt = new Date().toISOString();

    const logEntry = {
      ticketId,
      createdAt,
      type: data.type,
      priority: data.priority,
      email: data.email,
      name: data.name ?? null,
      subject: data.subject,
      messageLength: data.message.length,
      metadata: data.metadata ?? {},
    };

    console.info("[TechSupport] New ticket submitted:", JSON.stringify(logEntry, null, 2));

    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("support_tickets").insert({
          ticket_id: ticketId,
          type: data.type,
          priority: data.priority,
          email: data.email,
          name: data.name ?? null,
          subject: data.subject,
          message: data.message,
          metadata: data.metadata ?? {},
          status: "open",
          created_at: createdAt,
        });
      }
    } catch {}

    return Response.json(
      {
        success: true,
        ticketId,
        message: "Support request registered successfully.",
        createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TechSupport] Unexpected error handling support request:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error occurred while processing support request.",
      },
      { status: 500 }
    );
  }
}
