import unittest

from httpx import ASGITransport, AsyncClient

from app.main import app, settings


class AiServiceAuthTests(unittest.IsolatedAsyncioTestCase):
    """The AI service is internal: every request except health/docs needs the
    shared internal token, and the `user-id` header is only trusted after it."""

    def setUp(self):
        self._original_token = settings.internal_token
        settings.internal_token = "test-secret"

    def tearDown(self):
        settings.internal_token = self._original_token

    async def _client(self):
        transport = ASGITransport(app=app)
        return AsyncClient(transport=transport, base_url="http://test")

    async def test_health_is_public(self):
        async with await self._client() as client:
            response = await client.get("/api/health")
        self.assertEqual(response.status_code, 200)

    async def test_protected_route_rejects_missing_token(self):
        async with await self._client() as client:
            response = await client.get("/api/chat/conversations")
        self.assertEqual(response.status_code, 401)

    async def test_protected_route_rejects_wrong_token(self):
        async with await self._client() as client:
            response = await client.get(
                "/api/chat/conversations", headers={"x-internal-token": "wrong-secret"}
            )
        self.assertEqual(response.status_code, 401)

    async def test_protected_route_accepts_correct_token(self):
        async with await self._client() as client:
            response = await client.get(
                "/api/chat/conversations", headers={"x-internal-token": "test-secret"}
            )
        # Token is valid; a 503 (db unavailable) or 200 is fine — just not 401.
        self.assertNotEqual(response.status_code, 401)

    async def test_unconfigured_service_rejects_everything(self):
        settings.internal_token = ""
        async with await self._client() as client:
            response = await client.get("/api/chat/conversations")
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
