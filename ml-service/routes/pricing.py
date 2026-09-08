import numpy as np
from flask import Blueprint, jsonify, request

import model_state
from preprocess import build_feature_vector, validate_input
from config import DEFAULT_CURRENCY

bp = Blueprint("pricing", __name__)


@bp.route("/predict", methods=["POST"])
def predict():
    model = model_state.ensure_model()
    if model is None:
        return jsonify({"error": "Model not available. Run training/train_pricing.py first."}), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    errors = validate_input(data)
    if errors:
        return jsonify({"error": "Invalid input", "details": errors}), 400

    try:
        features = build_feature_vector(data)
        pred = model.predict(features)[0]

        trees = model.estimators_
        tree_preds = np.array([tree.predict(features)[0] for tree in trees])
        prediction_std = float(np.std(tree_preds))
        # Agreement between individual trees (0-1), NOT a calibrated probability.
        model_agreement = max(0, min(1, 1.0 - (prediction_std / max(pred, 1))))

        return jsonify(
            {
                "predictedPrice": round(float(pred), 2),
                "currency": str(data.get("currency") or DEFAULT_CURRENCY),
                "modelVersion": model_state.model_version,
                "predictionStd": round(prediction_std, 2),
                "modelAgreement": round(model_agreement, 4),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
