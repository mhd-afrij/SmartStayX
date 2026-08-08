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
        paths = {route.path for route in app.routes}
        self.assertIn("/api/chat/message", paths)
        self.assertIn("/api/chat/message/stream", paths)


if __name__ == "__main__":
    unittest.main()
