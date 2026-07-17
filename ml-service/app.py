import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from preprocess import build_feature_vector

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model = None


def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        print("No trained model found. Run train.py first.")
        return False
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded from {MODEL_PATH}")
    return True


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        if not load_model():
            return jsonify({"error": "Model not available. Run train.py first."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        features = build_feature_vector(data)
        pred = model.predict(features)[0]

        trees = model.estimators_
        tree_preds = np.array([tree.predict(features)[0] for tree in trees])
        std = float(np.std(tree_preds))
        confidence = max(0, min(1, 1.0 - (std / max(pred, 1))))

        return jsonify({
            "predictedPrice": round(float(pred), 2),
            "confidence": round(confidence, 4),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
    })


if __name__ == "__main__":
    load_model()
    port = int(os.environ.get("ML_SERVICE_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
