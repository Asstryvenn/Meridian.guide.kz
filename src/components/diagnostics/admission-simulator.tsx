"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { DataTag } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { RangeField } from "@/components/ui/fields";
import { Meter } from "@/components/ui/progress";
import { genzModelInfo, predictGeneral, type GenzFeature } from "@/lib/engine/genz-model";
import { featureCopy } from "@/lib/engine/prediction";
import { useT } from "@/lib/i18n/use-t";
import { useApp } from "@/lib/store/app-store";
import type { StudentProfile } from "@/lib/types";
import styles from "./admission-simulator.module.css";

interface SliderSpec {
  key: keyof StudentProfile;
  feature: GenzFeature;
  min: number;
  max: number;
  step: number;
  fallback: number;
  unit: string;
}

const sliders: SliderSpec[] = [
  { key: "essayScore", feature: "essay_score", min: 0, max: 100, step: 1, fallback: 75, unit: "/100" },
  { key: "recommendationScore", feature: "recommendation_score", min: 0, max: 100, step: 1, fallback: 78, unit: "/100" },
  { key: "interviewScore", feature: "interview_score", min: 0, max: 100, step: 1, fallback: 73, unit: "/100" },
  { key: "attendanceRate", feature: "attendance_rate", min: 60, max: 100, step: 1, fallback: 92, unit: "%" },
  { key: "onlineCertifications", feature: "online_certifications", min: 0, max: 12, step: 1, fallback: 2, unit: "" },
  { key: "socialMediaHours", feature: "social_media_hours", min: 0, max: 12, step: 0.5, fallback: 4.5, unit: "h" },
];

export function AdmissionSimulator() {
  const t = useT();
  const { profile, updateProfile } = useApp();
  const general = useMemo(() => predictGeneral(profile), [profile]);
  const percent = Math.round(general.probability * 100);
  const contributions = [...general.contributions]
    .filter((c) => !c.imputed && c.feature !== "act_score")
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 6);
  const maxImpact = Math.max(0.5, ...contributions.map((c) => Math.abs(c.impact)));

  return (
    <Card className={styles.card}>
      <CardHeader
        eyebrow={t("Machine learning")}
        title={t("Admission likelihood model")}
        action={<DataTag kind="prediction" label={t("Gen-Z dataset · {rows} applicants", { rows: genzModelInfo.rows.toLocaleString("en-US") })} />}
      />
      <div className={styles.layout}>
        <div className={styles.result}>
          <div className={styles.gauge}>
            <motion.span key={percent} className={clsx(styles.percent, "tabular")} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {percent}%
            </motion.span>
            <span className={styles.caption}>{t("general admission likelihood")}</span>
            <Meter value={percent} tone={percent >= 70 ? "green" : "amber"} label={t("General admission likelihood {percent}%", { percent })} />
          </div>
          <p className={styles.explainer}>
            {t("This is your chance in the general applicant pool the model was trained on ({base}% admitted). University-specific ranges in your matches adjust it for each school's selectivity.", {
              base: Math.round(genzModelInfo.baseRate * 100),
            })}
          </p>
          <ul className={styles.factors}>
            {contributions.map((c) => (
              <li key={c.feature}>
                <span className={styles.factorLabel}>{t(featureCopy[c.feature][0])}</span>
                <svg className={styles.factorBar} viewBox="-100 0 200 8" preserveAspectRatio="none" aria-hidden>
                  <rect x="-100" y="3" width="200" height="2" className={styles.axis} />
                  <rect x={c.impact < 0 ? (c.impact / maxImpact) * 100 : 0} y="0" width={Math.abs(c.impact / maxImpact) * 100} height="8" rx="3" className={c.impact >= 0 ? styles.positive : styles.negative} />
                </svg>
                <span className={clsx(styles.factorValue, "tabular", c.impact >= 0 ? styles.up : styles.down)}>{c.impact >= 0 ? "+" : "−"}{Math.abs(c.impact).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.inputs}>
          <p className={styles.inputsTitle}>{t("Estimate what the model can't see yet")}</p>
          {sliders.map((spec) => {
            const current = profile[spec.key] as number | null | undefined;
            const missing = current === null || current === undefined;
            return (
              <div key={spec.key} className={clsx(styles.slider, missing && styles.sliderMissing)}>
                <RangeField
                  label={featureCopy[spec.feature][0]}
                  value={missing ? spec.fallback : current}
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  onChange={(value) => updateProfile({ [spec.key]: value } as Partial<StudentProfile>)}
                  format={(v) => (missing ? t("Not set") : `${v}${spec.unit}`)}
                />
                {!missing && (
                  <button type="button" className={styles.clear} onClick={() => updateProfile({ [spec.key]: null } as Partial<StudentProfile>)}>
                    {t("Reset to average")}
                  </button>
                )}
              </div>
            );
          })}
          <p className={styles.fairness}>{t("Gender, state, family income and age are excluded from the model on purpose.")}</p>
        </div>
      </div>
      <p className={styles.footnote}>
        {t("Logistic regression, AUC {auc}, calibration error {ece}. Gradient boosting was tested and scored {boosted} AUC, so the simpler, explainable model is used. The dataset is synthetic — treat results as guidance.", {
          auc: genzModelInfo.auc,
          ece: genzModelInfo.ece,
          boosted: genzModelInfo.boostedAuc,
        })}
      </p>
    </Card>
  );
}
