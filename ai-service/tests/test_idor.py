"""IDOR (insecure direct object reference) tests.

The AI service is only reachable through the authenticated backend, so the
`user-id` header is trusted — but the service itself must still enforce
ownership on every resource. These tests verify:

    User A -> User A conversation    PASS
    User A -> User B conversation    DENY
    User A -> User B booking         DENY
    User A -> User B service request DENY

They run against a small in-memory Mongo fake so the real routing, tool, and
ownership logic is exercised without a live database.
"""
import copy
import json
import unittest
from datetime import datetime
from unittest.mock import AsyncMock, patch

from bson import ObjectId
from httpx import ASGITransport, AsyncClient

import app.database as database
from app.main import app, settings

# --- fixture ids -----------------------------------------------------------
def _oid(prefix, n):
    """Build a valid 24-char ObjectId: 4-hex prefix + 20-digit suffix."""
    return ObjectId(f"{prefix}{n:020d}")


H1 = _oid("61f0", 1)  # Grand Hotel, Colombo
H2 = _oid("61f0", 2)  # Ocean Resort, Galle
R1 = _oid("61f1", 1)  # room at H1
R2 = _oid("61f1", 2)  # room at H2
CONV_A = _oid("61f2", 1)
CONV_B = _oid("61f2", 2)


# --- minimal in-memory Mongo fake ------------------------------------------
def _value_matches(doc_value, cond):
    if isinstance(cond, dict):
        for op, opval in cond.items():
            if op == "$in" and doc_value not in opval:
                return False
            elif op == "$nin" and doc_value in opval:
                return False
            elif op == "$lt" and not (doc_value is not None and doc_value < opval):
                return False
            elif op == "$gt" and not (doc_value is not None and doc_value > opval):
                return False
        return True
    return doc_value == cond


def _matches(doc, query):
    return all(_value_matches(doc.get(key), cond) for key, cond in query.items())


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def sort(self, *args, **kwargs):
        return self

    def limit(self, n):
        return self

    async def to_list(self, length=None):
        docs = self._docs
        if length is not None:
            docs = docs[:length]
        return copy.deepcopy(docs)


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = docs if docs is not None else []

    async def find_one(self, query):
        for doc in self.docs:
            if _matches(doc, query):
                return copy.deepcopy(doc)
        return None

    def find(self, query):
        return FakeCursor([copy.deepcopy(d) for d in self.docs if _matches(d, query)])

    async def insert_one(self, doc):
        inserted = copy.deepcopy(doc)
        if "_id" not in inserted:
            inserted["_id"] = ObjectId()
        self.docs.append(inserted)
        return _Result(inserted["_id"], deleted_count=0)

    async def update_one(self, query, update):
        for doc in self.docs:
            if _matches(doc, query):
                if "$push" in update:
                    for k, v in update["$push"].items():
                        doc.setdefault(k, []).append(copy.deepcopy(v))
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = copy.deepcopy(v)
                return _Result(None, modified_count=1)
        return _Result(None, modified_count=0)

    async def delete_one(self, query):
        for i, doc in enumerate(self.docs):
            if _matches(doc, query):
                self.docs.pop(i)
                return _Result(None, deleted_count=1)
        return _Result(None, deleted_count=0)

    async def count_documents(self, query):
        return sum(1 for d in self.docs if _matches(d, query))


class _Result:
    def __init__(self, inserted_id=None, modified_count=0, deleted_count=0):
        self.inserted_id = inserted_id
        self.modified_count = modified_count
        self.deleted_count = deleted_count


class FakeDB:
    def __init__(self, **collections):
        for name, docs in collections.items():
            setattr(self, name, FakeCollection(docs))


def make_db():
    conv_a = {
        "_id": CONV_A,
        "userId": "user_a",
        "title": "A's conversation",
        "messages": [{"role": "user", "content": "hi", "createdAt": datetime.utcnow()}],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    conv_b = {
        "_id": CONV_B,
        "userId": "user_b",
        "title": "B's conversation",
        "messages": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    booking_a = {
        "_id": _oid("61f3", 1),
        "user": "user_a",
        "hotel": H1,
        "room": R1,
        "checkInDate": datetime(2026, 8, 20),
        "checkOutDate": datetime(2026, 8, 25),
        "status": "confirmed",
        "totalPrice": 120000,
        "guests": 2,
        "createdAt": datetime.utcnow(),
    }
    booking_b = {
        "_id": _oid("61f3", 2),
        "user": "user_b",
        "hotel": H2,
        "room": R2,
        "checkInDate": datetime(2026, 9, 1),
        "checkOutDate": datetime(2026, 9, 3),
        "status": "confirmed",
        "totalPrice": 60000,
        "guests": 1,
        "createdAt": datetime.utcnow(),
    }
    return FakeDB(
        conversations=[conv_a, conv_b],
        bookings=[booking_a, booking_b],
        hotels=[
            {"_id": H1, "name": "Grand Hotel", "city": "Colombo"},
            {"_id": H2, "name": "Ocean Resort", "city": "Galle"},
        ],
        rooms=[
            {"_id": R1, "hotel": H1, "roomNumber": "101", "roomType": "deluxe", "isAvailable": True},
            {"_id": R2, "hotel": H2, "roomNumber": "202", "roomType": "suite", "isAvailable": True},
        ],
        users=[],
        serviceRequests=[],
    )


TOKEN = "test-secret"
AUTH_HEADERS_A = {"x-internal-token": TOKEN, "user-id": "user_a"}
AUTH_HEADERS_B = {"x-internal-token": TOKEN, "user-id": "user_b"}


class IdorTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self._orig_token = settings.internal_token
        settings.internal_token = TOKEN
        self._orig_db = database.db
        self._orig_available = database.db_available
        database.db_available = True

    def tearDown(self):
        settings.internal_token = self._orig_token
        database.db = self._orig_db
        database.db_available = self._orig_available

    async def _get(self, path, headers):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(path, headers=headers)

    async def _post(self, path, json_body, headers):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(path, json=json_body, headers=headers)

    async def _delete(self, path, headers):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.delete(path, headers=headers)

    # --- conversations -----------------------------------------------------
    async def test_owner_can_read_own_conversation(self):
        database.db = make_db()
        response = await self._get(f"/api/chat/conversations/{CONV_A}", AUTH_HEADERS_A)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "A's conversation")

    async def test_other_user_cannot_read_conversation(self):
        database.db = make_db()
        response = await self._get(f"/api/chat/conversations/{CONV_A}", AUTH_HEADERS_B)
        self.assertEqual(response.status_code, 404)

    async def test_owner_can_delete_own_conversation(self):
        database.db = make_db()
        response = await self._delete(f"/api/chat/conversations/{CONV_A}", AUTH_HEADERS_A)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(await database.db.conversations.find_one({"_id": CONV_A}))

    async def test_other_user_cannot_delete_conversation(self):
        database.db = make_db()
        response = await self._delete(f"/api/chat/conversations/{CONV_A}", AUTH_HEADERS_B)
        self.assertEqual(response.status_code, 404)
        # Conversation must still exist afterwards.
        self.assertIsNotNone(await database.db.conversations.find_one({"_id": CONV_A}))

    async def test_other_user_cannot_continue_conversation(self):
        database.db = make_db()
        response = await self._post(
            "/api/chat/message",
            {"message": "hi", "conversationId": str(CONV_A)},
            AUTH_HEADERS_B,
        )
        self.assertEqual(response.status_code, 404)

    async def test_other_user_cannot_stream_conversation(self):
        database.db = make_db()
        response = await self._post(
            "/api/chat/message/stream",
            {"message": "hi", "conversationId": str(CONV_A)},
            AUTH_HEADERS_B,
        )
        self.assertEqual(response.status_code, 404)

    async def test_owner_can_continue_own_conversation(self):
        database.db = make_db()
        with patch("app.routers.chat.generate_response", new=AsyncMock(return_value="Sure thing!")), \
             patch("app.routers.chat.get_user_context", new=AsyncMock(return_value={})), \
             patch("app.routers.chat.get_hotel_context", new=AsyncMock(return_value=[])):
            response = await self._post(
                "/api/chat/message",
                {"message": "hi", "conversationId": str(CONV_A)},
                AUTH_HEADERS_A,
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Sure thing!")
        conv = await database.db.conversations.find_one({"_id": CONV_A})
        self.assertEqual(conv["messages"][-1]["role"], "assistant")

    # --- bookings ----------------------------------------------------------
    async def test_bookings_only_include_own(self):
        database.db = make_db()
        from app.services.context_service import get_user_bookings_db

        bookings = await get_user_bookings_db("user_a")
        hotels = [b["hotel"] for b in bookings]
        self.assertEqual(len(bookings), 1)
        self.assertEqual(hotels, ["Grand Hotel"])
        self.assertNotIn("Ocean Resort", hotels)

    async def test_get_user_bookings_tool_uses_authenticated_user(self):
        database.db = make_db()
        from app.services.llm_service import _execute_tool

        result = await _execute_tool("get_user_bookings", {}, "user_a")
        payload = json.loads(result)
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["hotel"], "Grand Hotel")

    async def test_get_user_bookings_tool_rejects_anonymous(self):
        database.db = make_db()
        from app.services.llm_service import _execute_tool

        result = await _execute_tool("get_user_bookings", {}, None)
        self.assertIn("not authenticated", result)

    # --- service requests --------------------------------------------------
    async def test_service_request_denied_for_user_without_stay(self):
        database.db = make_db()
        from app.services.context_service import create_service_request_db

        # user_b has a booking at H2, not H1.
        result = await create_service_request_db("user_b", "Housekeeping", "towels", str(H1))
        self.assertEqual(result.get("error"), "No active stay found at this hotel")

    async def test_service_request_denied_for_unbooked_hotel(self):
        database.db = make_db()
        from app.services.context_service import create_service_request_db

        # user_a has a booking at H1 only.
        result = await create_service_request_db("user_a", "Housekeeping", "towels", str(H2))
        self.assertEqual(result.get("error"), "No active stay found at this hotel")

    async def test_service_request_denied_for_cancelled_stay(self):
        database.db = make_db()
        for booking in database.db.bookings.docs:
            if booking["user"] == "user_a" and booking["hotel"] == H1:
                booking["status"] = "cancelled"
        from app.services.context_service import create_service_request_db

        result = await create_service_request_db("user_a", "Housekeeping", "towels", str(H1))
        self.assertEqual(result.get("error"), "No active stay found at this hotel")

    async def test_service_request_allowed_for_own_stay(self):
        database.db = make_db()
        from app.services.context_service import create_service_request_db

        # A client-supplied room number must be ignored; the room is resolved
        # from the guest's actual booking.
        result = await create_service_request_db(
            "user_a", "Housekeeping", "extra towels", str(H1), room_number="999"
        )
        self.assertIn("id", result)
        self.assertEqual(result["status"], "pending")

        docs = database.db.serviceRequests.docs
        self.assertEqual(len(docs), 1)
        doc = docs[0]
        self.assertEqual(doc["guest"], "user_a")
        self.assertEqual(doc["hotel"], H1)  # ObjectId, not a raw string
        self.assertEqual(doc["room"], R1)   # resolved from the booking, not client input
        self.assertEqual(doc["roomNumber"], "101")
        self.assertNotEqual(doc["roomNumber"], "999")

    async def test_service_request_rejects_invalid_hotel_id(self):
        database.db = make_db()
        from app.services.context_service import create_service_request_db

        result = await create_service_request_db("user_a", "Housekeeping", "x", "not-an-object-id")
        self.assertEqual(result.get("error"), "Invalid hotel id")

    async def test_service_request_rejects_unknown_service_type(self):
        database.db = make_db()
        from app.services.context_service import create_service_request_db

        result = await create_service_request_db("user_a", "Front Desk", "x", str(H1))
        self.assertEqual(result.get("error"), "Unsupported service type: Front Desk")


if __name__ == "__main__":
    unittest.main()
