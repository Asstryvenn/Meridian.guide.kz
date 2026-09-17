"use client";

import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { EssayEvaluator } from "@/components/essays/essay-evaluator";
import { useT } from "@/lib/i18n/use-t";

export default function EssaysPage() {
  const tx = useT();

  return (
    <Page>
      <PageHeader
        centered
        eyebrow={tx("Admissions Intelligence")}
        title={tx("Essay Evaluation Engine")}
        description={tx("Calibrated against 1,002 successful admissions essays. Analyze content substance, narrative tension, syntactic clarity, and predictive competitiveness.")}
      />

      <Reveal>
        <EssayEvaluator />
      </Reveal>
    </Page>
  );
}
