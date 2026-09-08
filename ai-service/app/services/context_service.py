from datetime import datetime

from bson import ObjectId

from app.database import get_db

# Mirrors the backend ServiceRequest model enum.
SERVICE_TYPES = {"Housekeeping", "Maintenance", "Room Service", "Other"}
# Bookings that entitle a guest to request service at a hotel.
ACTIVE_STAY_STATUSES = ["confirmed", "checked_in", "checked_out"]


async def get_user_context(user_id: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        return {"name": "Guest", "preferences": {}}

    bookings = (
        await db.bookings.find({"user": user_id})
        .sort("createdAt", -1)
        .limit(5)
        .to_list(length=5)
    )

    booking_summary = []
    for b in bookings:
        hotel = await db.hotels.find_one({"_id": ObjectId(b.get("hotel"))}) if b.get("hotel") else None
        booking_summary.append({
            "id": str(b["_id"]),
            "hotel": hotel["name"] if hotel else "Unknown",
            "hotelCity": hotel.get("city", "") if hotel else "",
            "checkIn": str(b.get("checkInDate", ""))[:10] if b.get("checkInDate") else "",
            "checkOut": str(b.get("checkOutDate", ""))[:10] if b.get("checkOutDate") else "",
            "status": b.get("status", ""),
            "guests": b.get("guests", 0),
        })

    name = user.get("name") or user.get("username") or "Guest"
    return {
        "userId": user_id,
        "name": name,
        "email": user.get("email", ""),
        "recentSearches": user.get("recentSearchedCities", []),
        "preferredCurrency": user.get("profile", {}).get("preferredCurrency", "USD"),
        "preferredLanguage": user.get("profile", {}).get("preferredLanguage", "en"),
        "recentBookings": booking_summary,
    }


async def get_hotel_context(limit: int = 5) -> list:
    db = get_db()
    hotels = await db.hotels.find().limit(limit).to_list(length=limit)
    result = []
    for h in hotels:
        # Rooms store `hotel` as an ObjectId — query with the ObjectId itself,
        # otherwise roomCount is always 0 (string never matches).
        room_count = await db.rooms.count_documents({"hotel": h["_id"]})
        result.append({
            "id": str(h["_id"]),
            "name": h.get("name", ""),
            "city": h.get("city", ""),
            "description": (h.get("description", "") or "")[:200],
            "roomCount": room_count,
            "rating": h.get("rating", 0),
            "amenities": h.get("amenities", []),
        })
    return result


async def search_hotels_db(query: str, limit: int = 5) -> list:
    db = get_db()
    import re
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    hotels = (
        await db.hotels.find({"$or": [{"name": pattern}, {"city": pattern}]})
        .limit(limit)
        .to_list(length=limit)
    )
    result = []
    for h in hotels:
        result.append({
            "id": str(h["_id"]),
            "name": h.get("name", ""),
            "city": h.get("city", ""),
            "description": (h.get("description", "") or "")[:200],
            "contact": h.get("contact", ""),
        })
    return result


async def get_available_rooms(hotel_id: str, check_in: str, check_out: str) -> list:
    db = get_db()
    try:
        hotel_oid = ObjectId(hotel_id)
    except Exception:
        return []
    hotel = await db.hotels.find_one({"_id": hotel_oid})
    if not hotel:
        return []

    # Rooms store hotel as an ObjectId; matching the raw string never hits.
    rooms = (
        await db.rooms.find({"hotel": hotel_oid, "isAvailable": True})
        .limit(10)
        .to_list(length=10)
    )

    result = []
    for room in rooms:
        overlapping = await db.bookings.count_documents({
            "room": str(room["_id"]),
            "checkInDate": {"$lt": check_out},
            "checkOutDate": {"$gt": check_in},
            "status": {"$nin": ["cancelled", "expired"]},
        })
        if overlapping == 0:
            result.append({
                "id": str(room["_id"]),
                "roomNumber": room.get("roomNumber", ""),
                "roomType": room.get("roomType", ""),
                "pricePerNight": float(room.get("pricePerNight", 0)),
                "amenities": room.get("amenities", []),
            })
    return result


async def get_hotel_details_db(hotel_id: str) -> dict | None:
    db = get_db()
    hotel = await db.hotels.find_one({"_id": ObjectId(hotel_id)})
    if not hotel:
        return None
    return {
        "id": str(hotel["_id"]),
        "name": hotel.get("name", ""),
        "city": hotel.get("city", ""),
        "description": hotel.get("description", ""),
        "address": hotel.get("address", ""),
        "contact": hotel.get("contact", ""),
        "amenities": hotel.get("amenities", []),
    }


async def get_user_bookings_db(user_id: str) -> list:
    db = get_db()
    bookings = (
        await db.bookings.find({"user": user_id})
        .sort("createdAt", -1)
        .limit(20)
        .to_list(length=20)
    )
    result = []
    for b in bookings:
        hotel = await db.hotels.find_one({"_id": ObjectId(b["hotel"])}) if b.get("hotel") else None
        room = await db.rooms.find_one({"_id": ObjectId(b["room"])}) if b.get("room") else None
        result.append({
            "id": str(b["_id"]),
            "hotel": hotel.get("name", "Unknown") if hotel else "Unknown",
            "hotelCity": hotel.get("city", "") if hotel else "",
            "roomType": room.get("roomType", "") if room else "",
            "checkIn": str(b.get("checkInDate", ""))[:10] if b.get("checkInDate") else "",
            "checkOut": str(b.get("checkOutDate", ""))[:10] if b.get("checkOutDate") else "",
            "status": b.get("status", ""),
            "totalPrice": float(b.get("totalPrice", 0)),
            "guests": b.get("guests", 0),
        })
    return result


async def get_booking_status_db(user_id: str, booking_id: str) -> dict:
    """Return one of the caller's bookings by id.

    Ownership is enforced inside the query itself: a booking owned by someone
    else is indistinguishable from a missing one (404 semantics, no probing).
    """
    db = get_db()

    try:
        oid = ObjectId(booking_id)
    except Exception:
        return {"error": "Invalid booking id"}

    booking = await db.bookings.find_one({"_id": oid, "user": user_id})
    if not booking:
        return {"error": "Booking not found"}

    hotel = None
    room = None
    if booking.get("hotel"):
        try:
            hotel = await db.hotels.find_one({"_id": ObjectId(booking["hotel"])})
        except Exception:
            hotel = None
    if booking.get("room"):
        try:
            room = await db.rooms.find_one({"_id": ObjectId(booking["room"])})
        except Exception:
            room = None

    recent_changes = [
        {
            "from": h.get("from"),
            "to": h.get("to"),
            "at": str(h.get("at", "")),
            "reason": h.get("reason", ""),
        }
        for h in (booking.get("statusHistory") or [])[-5:]
    ]

    return {
        "id": str(booking["_id"]),
        "status": booking.get("status", ""),
        "hotel": hotel.get("name", "Unknown") if hotel else "Unknown",
        "roomType": room.get("roomType", "") if room else "",
        "checkIn": str(booking.get("checkInDate", ""))[:10] if booking.get("checkInDate") else "",
        "checkOut": str(booking.get("checkOutDate", ""))[:10] if booking.get("checkOutDate") else "",
        "guests": booking.get("guests", 0),
        "totalPrice": float(booking.get("totalPrice", 0)),
        "paymentMethod": booking.get("paymentMethod", ""),
        "isPaid": bool(booking.get("isPaid", False)),
        "recentStatusChanges": recent_changes,
    }


async def create_service_request_db(user_id: str, service_type: str, details: str, hotel_id: str, room_number: str = "") -> dict:
    """Create a service request only for a stay the guest actually has.

    The guest must hold a non-cancelled booking at the given hotel, and the
    request is attached to that booking's room. Client-supplied hotel/room
    ids are never trusted as-is; they are validated against the booking.
    """
    db = get_db()

    if service_type not in SERVICE_TYPES:
        return {"error": f"Unsupported service type: {service_type}"}

    try:
        hotel_oid = ObjectId(hotel_id)
    except Exception:
        return {"error": "Invalid hotel id"}

    hotel = await db.hotels.find_one({"_id": hotel_oid})
    if not hotel:
        return {"error": "Hotel not found"}

    # Ownership check: the guest must have an active booking at this hotel.
    booking = await db.bookings.find_one(
        {
            "user": user_id,
            "hotel": hotel_oid,
            "status": {"$in": ACTIVE_STAY_STATUSES},
        }
    )
    if not booking:
        return {"error": "No active stay found at this hotel"}

    room = None
    if booking.get("room"):
        try:
            room = await db.rooms.find_one({"_id": ObjectId(booking["room"])})
        except Exception:
            room = None
    if not room:
        return {"error": "No room found for the active stay"}

    request = {
        "guest": user_id,
        "hotel": hotel_oid,
        "room": room["_id"],
        "roomNumber": room.get("roomNumber", ""),
        "serviceType": service_type,
        "requestDetails": details,
        "status": "pending",
        "createdAt": datetime.utcnow(),
    }
    result = await db.serviceRequests.insert_one(request)
    return {"id": str(result.inserted_id), "status": "pending", "serviceType": service_type}
