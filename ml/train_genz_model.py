import json
import sys
import warnings
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore", category=RuntimeWarning)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "ml" / "data" / "genz_college_admission_prediction.csv"
OUTPUT = ROOT / "src" / "lib" / "engine" / "genz-model.json"

FEATURES = [
    "high_school_gpa",
    "sat_score",
    "act_score",
    "attendance_rate",
    "ap_courses",
    "extracurricular_count",
    "volunteer_hours",
    "leadership_positions",
    "coding_projects",
    "social_media_hours",
    "online_certifications",
    "essay_score",
    "recommendation_score",
    "interview_score",
]
EXCLUDED = ["student_id", "age", "gender", "state", "family_income"]
TARGET = "admission_status"
BOOTSTRAPS = 30
RNG = np.random.default_rng(2026)


def expected_calibration_error(y_true, p, bins=15):
    edges = np.linspace(0, 1, bins + 1)
    total = 0.0
    for lower, upper in zip(edges[:-1], edges[1:]):
        mask = (p >= lower) & (p < upper)
        if mask.any():
            total += mask.mean() * abs(p[mask].mean() - y_true[mask].mean())
    return float(total)


def fit_logistic(X, y):
    mean = X.mean(axis=0)
    scale = X.std(axis=0)
    scale[scale == 0] = 1
    model = LogisticRegression(max_iter=1000).fit((X - mean) / scale, y)
    return model, mean, scale


def main():
    if not DATA.exists():
        sys.exit(f"Dataset not found at {DATA}. Place genz_college_admission_prediction.csv there first.")

    df = pd.read_csv(DATA, usecols=FEATURES + [TARGET]).dropna()
    X = df[FEATURES].to_numpy(np.float64)
    y = df[TARGET].to_numpy()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)

    model, mean, scale = fit_logistic(X_train, y_train)
    p = model.predict_proba((X_test - mean) / scale)[:, 1]

    boosted = HistGradientBoostingClassifier(max_depth=4, max_iter=300, learning_rate=0.08, early_stopping=False, random_state=7).fit(X_train, y_train)
    p_boosted = boosted.predict_proba(X_test)[:, 1]

    bootstrap = []
    for _ in range(BOOTSTRAPS):
        index = RNG.integers(0, len(X_train), 60_000)
        sample, _, _ = fit_logistic(X_train[index], y_train[index])
        sample_scaled_coef = sample.coef_[0]
        bootstrap.append([float(sample.intercept_[0]), *map(float, sample_scaled_coef)])

    artifact = {
        "version": "2.0.0",
        "trained_on": date.today().isoformat(),
        "dataset": {
            "name": "Gen-Z College Admission Prediction",
            "rows": int(len(df)),
            "base_rate": float(y.mean()),
            "note": "Public synthetic dataset. Predicts general admission likelihood, not a specific institution.",
            "excluded_features": EXCLUDED,
        },
        "features": FEATURES,
        "mean": list(map(float, mean)),
        "scale": list(map(float, scale)),
        "medians": {f: float(df[f].median()) for f in FEATURES},
        "intercept": float(model.intercept_[0]),
        "coefficients": list(map(float, model.coef_[0])),
        "bootstrap": bootstrap,
        "metrics": {
            "roc_auc": round(float(roc_auc_score(y_test, p)), 4),
            "brier": round(float(brier_score_loss(y_test, p)), 4),
            "ece": round(expected_calibration_error(y_test, p), 4),
            "test_size": int(len(y_test)),
            "gradient_boosting_roc_auc": round(float(roc_auc_score(y_test, p_boosted)), 4),
        },
    }

    OUTPUT.write_text(json.dumps(artifact, indent=2))
    print(json.dumps(artifact["metrics"], indent=2))
    for name, coef in sorted(zip(FEATURES, model.coef_[0]), key=lambda t: -abs(t[1])):
        print(f"  {name:24s} {coef:+.3f}")


if __name__ == "__main__":
    main()
