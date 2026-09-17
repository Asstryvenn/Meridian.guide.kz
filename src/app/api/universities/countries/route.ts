import { directoryCountries } from "@/lib/directory/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ countries: await directoryCountries() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ countries: [] }, { status: 503 });
  }
}
