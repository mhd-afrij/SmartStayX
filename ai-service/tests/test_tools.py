import unittest

from app.services.context_service import get_booking_status_db
from app.services.llm_service import _language_instruction
from app.utils.tools import TOOL_DEFINITIONS


class ToolRegistryTests(unittest.TestCase):
    def test_tool_names_are_unique(self):
        names = [t["function"]["name"] for t in TOOL_DEFINITIONS]
        self.assertEqual(len(names), len(set(names)))

    def test_every_tool_has_valid_shape(self):
        for tool in TOOL_DEFINITIONS:
            self.assertEqual(tool["type"], "function")
            fn = tool["function"]
            self.assertIn("name", fn)
            self.assertIn("description", fn)
            self.assertIn("parameters", fn)
            self.assertEqual(fn["parameters"].get("type"), "object")

    def test_booking_status_tool_is_registered(self):
        tool = next(
            (t for t in TOOL_DEFINITIONS if t["function"]["name"] == "get_booking_status"),
            None,
        )
        self.assertIsNotNone(tool)
        self.assertEqual(tool["function"]["parameters"]["required"], ["bookingId"])


class LanguageInstructionTests(unittest.TestCase):
    def test_no_language_uses_conversation_language(self):
        instruction = _language_instruction(None, None)
        self.assertIn("same language", instruction)

    def test_language_and_name(self):
        instruction = _language_instruction("si", "Sinhala")
        self.assertEqual(instruction, "Respond only in Sinhala (si).")

    def test_language_only(self):
        instruction = _language_instruction("ta", None)
        self.assertEqual(instruction, "Respond only in ta.")

    def test_name_only(self):
        instruction = _language_instruction(None, "Tamil")
        self.assertEqual(instruction, "Respond only in Tamil.")


class BookingStatusValidationTests(unittest.IsolatedAsyncioTestCase):
    async def test_invalid_booking_id_is_rejected_before_any_lookup(self):
        result = await get_booking_status_db("user-1", "not-an-object-id")
        self.assertEqual(result, {"error": "Invalid booking id"})

    async def test_missing_booking_reports_not_found(self):
        class FakeBookings:
            async def find_one(self, query):
                return None

        class FakeDb:
            bookings = FakeBookings()

        from unittest.mock import patch

        with patch("app.services.context_service.get_db", return_value=FakeDb()):
            result = await get_booking_status_db("user-1", "507f1f77bcf86cd799439011")
        self.assertEqual(result, {"error": "Booking not found"})

    async def test_other_users_booking_is_hidden(self):
        class FakeBookings:
            def __init__(self):
                self.captured_query = None

            async def find_one(self, query):
                self.captured_query = query
                # Ownership filter is part of the query; simulate no match.
                return None

        fake_bookings = FakeBookings()

        class FakeDb:
            bookings = fake_bookings

        from unittest.mock import patch

        with patch("app.services.context_service.get_db", return_value=FakeDb()):
            result = await get_booking_status_db(
                "user-1", "507f1f77bcf86cd799439011"
            )
        self.assertEqual(result, {"error": "Booking not found"})
        self.assertEqual(fake_bookings.captured_query.get("user"), "user-1")
        self.assertIn("_id", fake_bookings.captured_query)


if __name__ == "__main__":
    unittest.main()
