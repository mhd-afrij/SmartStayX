import hmac

from flask import jsonify, request

# Non-data routes that stay reachable without the internal token.
PUBLIC_PATHS = {"/health"}


def register_internal_auth(app):
    """Shared-secret gate mirroring ai-service/app/middleware/auth.py.

    Every request except PUBLIC_PATHS must carry `x-internal-token`. The token
    is read on every request so tests can toggle it without restarting.
    """

    @app.before_request
    def _require_internal_token():
        if request.path in PUBLIC_PATHS:
            return None

        from config import internal_token

        token = internal_token()
        if not token:
            return (
                jsonify(
                    {"detail": "ML service is not configured: set ML_INTERNAL_TOKEN."}
                ),
                503,
            )

        provided = request.headers.get("x-internal-token", "")
        if not provided or not hmac.compare_digest(
            provided.encode("utf-8"), token.encode("utf-8")
        ):
            return jsonify({"detail": "Unauthorized"}), 401

        return None
