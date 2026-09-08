import os

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")

PRICING_MODEL_PATH = (
    os.environ.get("PRICING_MODEL_PATH") or os.path.join(SAVED_MODELS_DIR, "pricing_model.pkl")
)
PRICING_META_PATH = (
    os.environ.get("PRICING_META_PATH")
    or os.path.join(SAVED_MODELS_DIR, "pricing_model_meta.json")
)

DEFAULT_CURRENCY = os.environ.get("DEFAULT_CURRENCY", "USD")


def internal_token() -> str:
    return os.environ.get("ML_INTERNAL_TOKEN", "")
