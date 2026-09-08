import os

from flask import Flask, jsonify
from flask_cors import CORS

import model_state
from auth import register_internal_auth
from routes import register_routes


def create_app():
    app = Flask(__name__)
    CORS(app)
    register_internal_auth(app)
    register_routes(app)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify(
            {
                "status": "ok",
                "service": "ml-service",
                "modelLoaded": model_state.model is not None,
                "modelVersion": model_state.model_version,
            }
        )

    return app


model_state.load_model()
app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", 5000))
    host = os.environ.get("ML_SERVICE_HOST", "127.0.0.1")
    app.run(host=host, port=port, debug=False)
