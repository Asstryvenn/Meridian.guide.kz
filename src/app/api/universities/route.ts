import { z } from "zod";
import { searchDirectory } from "@/lib/directory/service";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().max(120).default(""),
  country: z.string().trim().max(80).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(10).max(60).default(30),
});

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  try {
    const page = await searchDirectory(parsed.data);
    return Response.json(page, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ error: "The university directory is temporarily unavailable." }, { status: 503 });
  }
}
