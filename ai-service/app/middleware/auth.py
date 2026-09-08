"""Internal authentication for the AI service.

The AI service is only reachable through the Node.js backend, which authenticates
the user (Clerk) and forwards their identity in the `user-id` header. That header
is only trustworthy if the caller proves knowledge of the shared secret
(`AI_INTERNAL_TOKEN`), so every request except health checks must carry it.

The token is read from settings on every request so tests can toggle it without
restarting the app.
"""
import hmac

from starlette.responses import JSONResponse

# Non-data routes that stay reachable without the internal token.
PUBLIC_PATHS = {"/api/health", "/docs", "/redoc", "/openapi.json"}


class InternalAuthMiddleware:
    def __init__(self, app, settings=None):
        self.app = app
        self.settings = settings

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        if scope.get("path") in PUBLIC_PATHS:
            return await self.app(scope, receive, send)

        token = self.settings.internal_token if self.settings else ""

        if not token:
            response = JSONResponse(
                status_code=503,
                content={"detail": "AI service is not configured: set AI_INTERNAL_TOKEN."},
            )
            return await response(scope, receive, send)

        headers = dict(scope.get("headers", []))
        provided = headers.get(b"x-internal-token", b"")
        if not provided or not hmac.compare_digest(
            provided.decode("utf-8", "replace"), token
        ):
            response = JSONResponse(status_code=401, content={"detail": "Unauthorized"})
            return await response(scope, receive, send)

        return await self.app(scope, receive, send)
