import clsx from "clsx";
import { DataTag } from "@/components/ui/badge";
import { Meter } from "@/components/ui/progress";
import { formatRange, type Prediction } from "@/lib/engine/prediction";
import styles from "./prediction-panel.module.css";

export function PredictionRange({ prediction, size = "md" }: { prediction: Prediction; size?: "md" | "lg" }) {
  return (
    <div className={clsx(styles.range, styles[size])}>
      <span className={clsx(styles.rangeValue, "tabular")}>{formatRange(prediction)}</span>
      <span className={styles.confidence} data-confidence={prediction.confidence}>
        {prediction.confidence} confidence
      </span>
    </div>
  );
}

export function PredictionPanel({ prediction }: { prediction: Prediction }) {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <DataTag kind="prediction" label="ML admission estimate" />
      </div>
      <PredictionRange prediction={prediction} size="lg" />
      <Meter value={null} range={[prediction.low, prediction.high]} tone="amber" label={`Estimated admission range ${formatRange(prediction)}`} />
      <div className={styles.factors}>
        <div>
          <p className={styles.factorTitle}>Working for you</p>
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
            <p className="faint">No strong positive factors yet.</p>
          )}
        </div>
        <div>
          <p className={styles.factorTitle}>Working against you</p>
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
            <p className="faint">No major negative factors detected.</p>
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
        Logistic model v{prediction.model.version} trained on {prediction.model.trainingData} applicant data (AUC {prediction.model.auc}, calibration error {prediction.model.ece}). A range, not a promise — admissions are holistic.
      </p>
    </div>
  );
}
