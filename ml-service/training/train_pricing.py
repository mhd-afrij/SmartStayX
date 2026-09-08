import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import DATASETS_DIR, PRICING_META_PATH, PRICING_MODEL_PATH  # noqa: E402
from preprocess import FEATURE_NAMES, generate_sample_training_data  # noqa: E402

# Preferred dataset (clearly labeled synthetic, spec §27). The legacy
# data/historical_bookings.csv path is still honored if present.
SYNTHETIC_DATA_PATH = os.path.join(DATASETS_DIR, "synthetic_pricing_training.csv")
LEGACY_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "historical_bookings.csv")

# Bump when the feature set or training approach changes materially.
MODEL_VERSION = "1.0.0"


def load_data():
    for path in (SYNTHETIC_DATA_PATH, LEGACY_DATA_PATH):
        if os.path.exists(path):
            df = pd.read_csv(path)
            required = set(FEATURE_NAMES + ["finalPrice"])
            if required.issubset(df.columns):
                print(f"Training on {path}")
                return df
    print("No training data found. Generating labeled SYNTHETIC sample data...")
    df = generate_sample_training_data(1000)
    os.makedirs(DATASETS_DIR, exist_ok=True)
    df.to_csv(SYNTHETIC_DATA_PATH, index=False)
    print(f"SYNTHETIC dataset saved to {SYNTHETIC_DATA_PATH} (not real hotel behaviour)")
    return df


def train():
    df = load_data()

    X = df[FEATURE_NAMES].values
    y = df["finalPrice"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print("Model trained successfully.")
    print(f"Test MAE:  {mae:.2f}")
    print(f"Test RMSE: {rmse:.2f}")
    print(f"R² Score:  {model.score(X_test, y_test):.4f}")

    os.makedirs(os.path.dirname(PRICING_MODEL_PATH), exist_ok=True)
    joblib.dump(model, PRICING_MODEL_PATH)
    print(f"Model saved to {PRICING_MODEL_PATH}")

    meta = {
        "model": os.path.basename(PRICING_MODEL_PATH),
        "version": MODEL_VERSION,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "features": FEATURE_NAMES,
        "dataset": "synthetic" if not os.path.exists(
            os.path.join(DATASETS_DIR, "REAL_DATA_MARKER")
        ) else "real",
        "testMae": round(mae, 2),
        "testRmse": round(float(rmse), 2),
    }
    with open(PRICING_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Model metadata saved to {PRICING_META_PATH} (version {MODEL_VERSION})")
    return model


if __name__ == "__main__":
    train()
