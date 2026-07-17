from app.database import get_db
from bson import ObjectId


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
        room_count = await db.rooms.count_documents({"hotel": str(h["_id"])})
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
    hotel = await db.hotels.find_one({"_id": ObjectId(hotel_id)})
    if not hotel:
        return []

    rooms = (
        await db.rooms.find({"hotel": hotel_id, "isAvailable": True})
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


async def create_service_request_db(user_id: str, service_type: str, details: str, hotel_id: str, room_number: str = "") -> dict:
    db = get_db()
    request = {
        "guest": user_id,
        "hotel": hotel_id,
        "serviceType": service_type,
        "requestDetails": details,
        "roomNumber": room_number,
        "status": "pending",
        "createdAt": __import__("datetime").datetime.utcnow(),
    }
    result = await db.serviceRequests.insert_one(request)
    return {"id": str(result.inserted_id), "status": "pending", "serviceType": service_type}
