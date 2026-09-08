import json
import os

import joblib

from config import PRICING_META_PATH, PRICING_MODEL_PATH

model = None
model_version = None


def load_model():
    global model, model_version
    if not os.path.exists(PRICING_MODEL_PATH):
        print(f"No trained model found at {PRICING_MODEL_PATH}. Run training/train_pricing.py first.")
        return False
    model = joblib.load(PRICING_MODEL_PATH)
    model_version = None
    if os.path.exists(PRICING_META_PATH):
        try:
            with open(PRICING_META_PATH, "r", encoding="utf-8") as f:
                meta = json.load(f)
            model_version = meta.get("version")
        except Exception:
            model_version = None
    print(
        f"Model loaded from {PRICING_MODEL_PATH}"
        + (f" (version {model_version})" if model_version else "")
    )
    return True


def ensure_model():
    if model is None:
        load_model()
    return model
