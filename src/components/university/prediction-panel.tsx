import clsx from "clsx";
import { DataTag } from "@/components/ui/badge";
import { Meter } from "@/components/ui/progress";
import { formatRange, type Prediction } from "@/lib/engine/prediction";
import styles from "./prediction-panel.module.css";
import { useT } from "@/lib/i18n/use-t";

export function PredictionRange({ prediction, size = "md" }: { prediction: Prediction; size?: "md" | "lg" }) {
  const t = useT();
  return (
    <div className={clsx(styles.range, styles[size])}>
      <span className={clsx(styles.rangeValue, "tabular")}>{formatRange(prediction) === "Under 5%" ? t("Under 5%") : formatRange(prediction)}</span>
      <span className={styles.confidence} data-confidence={prediction.confidence}>
        {t(prediction.confidence === "high" ? "high confidence" : prediction.confidence === "medium" ? "medium confidence" : "low confidence")}
      </span>
    </div>
  );
}

export function PredictionPanel({ prediction }: { prediction: Prediction }) {
  const t = useT();
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <DataTag kind="prediction" label={t("ML admission estimate")} />
      </div>
      <PredictionRange prediction={prediction} size="lg" />
      <Meter value={null} range={[prediction.low, prediction.high]} tone="amber" label={t("Estimated admission range {formatRange}", { formatRange: formatRange(prediction) })} />
      <div className={styles.factors}>
        <div>
          <p className={styles.factorTitle}>{t("Working for you")}</p>
          {prediction.positives.length ? (
            <ul className={styles.list}>
              {prediction.positives.map((f) => (
                <li key={f.label} className={styles.positive}>
                  <strong>{f.label}</strong>
                  <span>{f.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="faint">{t("No strong positive factors yet.")}</p>
          )}
        </div>
        <div>
          <p className={styles.factorTitle}>{t("Working against you")}</p>
          {prediction.negatives.length ? (
            <ul className={styles.list}>
              {prediction.negatives.map((f) => (
                <li key={f.label} className={styles.negative}>
                  <strong>{f.label}</strong>
                  <span>{f.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="faint">{t("No major negative factors detected.")}</p>
          )}
        </div>
      </div>
      {prediction.assumptions.length > 0 && (
        <ul className={styles.assumptions}>
          {prediction.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
      <p className={styles.model}>
        Logistic model v{prediction.model.version} trained on {prediction.model.trainingData}, AUC {prediction.model.auc}, calibration error {prediction.model.ece}. The dataset is synthetic and predicts general admission; the range is adjusted to this university&apos;s selectivity. A guide, not a promise.
      </p>
    </div>
  );
}
