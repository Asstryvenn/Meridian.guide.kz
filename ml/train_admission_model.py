import json
import warnings
from datetime import date
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

FEATURES = [
    "selectivity_logit",
    "academic",
    "test",
    "test_missing",
    "english_gap",
    "activities",
    "research",
    "leadership",
    "strength_x_selectivity",
]

OUTPUT = Path(__file__).resolve().parents[1] / "src" / "lib" / "engine" / "admission-model.json"
RNG = np.random.default_rng(2026)
warnings.filterwarnings("ignore", category=RuntimeWarning)


def logit(p):
    return np.log(p / (1 - p))


def simulate_applicants(n):
    acceptance = np.exp(RNG.uniform(np.log(0.03), np.log(0.92), n))
    academic = np.clip(RNG.beta(6, 2, n), 0, 1)
    test_missing = (RNG.random(n) < 0.25).astype(float)
    test_raw = np.clip(academic * 0.6 + RNG.normal(0.3, 0.12, n), 0, 1)
    test = np.where(test_missing == 1, 0.5, test_raw)
    english_gap = np.clip(RNG.normal(0.15, 0.35, n), -1, 1)
    english_gap = np.minimum(english_gap, 0)
    activities = np.clip(RNG.beta(2, 3, n), 0, 1)
    research = (RNG.random(n) < 0.2) * RNG.uniform(0.3, 1, n)
    leadership = np.clip(RNG.beta(2, 4, n), 0, 1)

    selectivity = logit(acceptance)
    strength = 0.45 * academic + 0.25 * test_raw + 0.2 * activities + 0.1 * research
    interaction = (strength - 0.55) * -selectivity

    latent = (
        selectivity
        + 3.0 * (academic - 0.78)
        + 1.8 * (test_raw - 0.72)
        + 1.6 * (activities - 0.4)
        + 1.1 * research
        + 0.7 * (leadership - 0.3)
        + 2.5 * english_gap
        + 0.9 * interaction
    )
    admitted = (RNG.random(n) < 1 / (1 + np.exp(-latent))).astype(int)

    X = np.column_stack([
        selectivity,
        academic,
        test,
        test_missing,
        english_gap,
        activities,
        research,
        leadership,
        (0.45 * academic + 0.25 * test + 0.2 * activities + 0.1 * research - 0.55) * -selectivity,
    ])
    return X, admitted


def expected_calibration_error(y_true, y_prob, bins=10):
    edges = np.linspace(0, 1, bins + 1)
    error = 0.0
    for lower, upper in zip(edges[:-1], edges[1:]):
        mask = (y_prob >= lower) & (y_prob < upper)
        if mask.any():
            error += mask.mean() * abs(y_prob[mask].mean() - y_true[mask].mean())
    return float(error)


def main():
    X, y = simulate_applicants(60000)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)

    model = LogisticRegression(max_iter=2000, C=1.0)
    model.fit(X_train, y_train)
    probabilities = model.predict_proba(X_test)[:, 1]

    bootstrap = []
    for _ in range(40):
        index = RNG.integers(0, len(X_train), 6000)
        sample = LogisticRegression(max_iter=2000, C=1.0).fit(X_train[index], y_train[index])
        bootstrap.append([float(sample.intercept_[0]), *map(float, sample.coef_[0])])

    artifact = {
        "version": "0.1.0",
        "trained_on": date.today().isoformat(),
        "training_data": "synthetic",
        "disclaimer": "Prototype trained on simulated applicants. Replace with real, consented outcome data before relying on it.",
        "features": FEATURES,
        "intercept": float(model.intercept_[0]),
        "coefficients": list(map(float, model.coef_[0])),
        "bootstrap": bootstrap,
        "metrics": {
            "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
            "brier": round(float(brier_score_loss(y_test, probabilities)), 4),
            "ece": round(expected_calibration_error(y_test, probabilities), 4),
            "test_size": int(len(y_test)),
        },
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(artifact, indent=2))
    print(json.dumps(artifact["metrics"], indent=2))


if __name__ == "__main__":
    main()
