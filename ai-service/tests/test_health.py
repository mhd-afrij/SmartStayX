import unittest

from httpx import ASGITransport, AsyncClient

from app.main import app


class AiServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_health_endpoint(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["service"], "SmartStayX AI Microservice")

    def test_routes_are_registered(self):
        # Newer FastAPI versions expose included routers as `_IncludedRouter`
        # wrappers whose sub-routes live under `original_router`, so unwrap
        # defensively and compare full paths (prefix + route path).
        paths = set()
        for route in app.routes:
            path = getattr(route, "path", None)
            if path:
                paths.add(path)
                continue
            original = getattr(route, "original_router", None)
            if original is None:
                continue
            # APIRoute.path is already fully prefixed (e.g. /api/chat/message).
            for sub in original.routes:
                sub_path = getattr(sub, "path", None)
                if sub_path:
                    paths.add(sub_path)
        self.assertIn("/api/chat/message", paths)
        self.assertIn("/api/chat/message/stream", paths)


if __name__ == "__main__":
    unittest.main()
