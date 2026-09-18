import { z } from "zod";
import { universities } from "@/lib/data/universities";
import { genzModelInfo, predictGeneral } from "@/lib/engine/genz-model";
import { featureCopy, predictAdmission } from "@/lib/engine/prediction";
import { superviseMLPrediction } from "@/lib/ai/supervision";
import type { StudentProfile } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  profile: z.custom<StudentProfile>((value) => typeof value === "object" && value !== null && "activities" in value && "fields" in value),
  universities: z.array(z.string()).max(50).optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { profile } = parsed.data;
  const general = predictGeneral(profile);
  const pool = parsed.data.universities?.length ? universities.filter((u) => parsed.data.universities?.includes(u.slug)) : universities;

  const generalData = {
    probability: Math.round(general.probability * 1000) / 10,
    range: [Math.round(general.low * 1000) / 10, Math.round(general.high * 1000) / 10],
    missingInputs: general.imputed.map((f) => featureCopy[f][0]),
    factors: general.contributions
      .filter((c) => !c.imputed)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .map((c) => ({ factor: featureCopy[c.feature][0], value: c.value, impact: Math.round(c.impact * 100) / 100 })),
  };

  const poolData = pool.map((u) => {
    const p = predictAdmission(profile, u);
    return { slug: u.slug, name: u.name, range: [p.low, p.high], midpoint: p.midpoint, confidence: p.confidence };
  });

  const supervision = await superviseMLPrediction(profile, {
    general: generalData,
    universitiesSample: poolData.slice(0, 5),
  });

  return Response.json({
    model: genzModelInfo,
    general: generalData,
    universities: poolData,
    supervision: {
      verified: supervision.approved,
      safetyVerdict: supervision.safetyVerdict,
      confidenceScore: supervision.confidenceScore,
    },
  });
}
