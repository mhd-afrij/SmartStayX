from app.services.context_service import get_user_context, get_hotel_context
from app.database import get_db


async def get_ai_recommendations(user_id: str) -> dict:
    user_ctx = await get_user_context(user_id)
    db = get_db()

    preferred_cities = user_ctx.get("recentSearches", [])
    recent_bookings = user_ctx.get("recentBookings", [])

    for b in recent_bookings:
        city = b.get("hotelCity", "")
        if city and city not in preferred_cities:
            preferred_cities.append(city)

    pipeline = []

    if preferred_cities:
        pipeline.append({
            "$lookup": {
                "from": "hotels",
                "localField": "hotel",
                "foreignField": "_id",
                "as": "hotel",
            }
        })
        pipeline.append({"$unwind": {"path": "$hotel", "preserveNullAndEmptyArrays": False}})
        pipeline.append({
            "$match": {
                "hotel.city": {"$in": preferred_cities},
                "isAvailable": True,
            }
        })
        pipeline.append({
            "$project": {
                "_id": 1,
                "roomNumber": 1,
                "roomType": 1,
                "pricePerNight": 1,
                "amenities": 1,
                "images": 1,
                "hotelName": "$hotel.name",
                "hotelCity": "$hotel.city",
            }
        })
        pipeline.append({"$limit": 10})

    if pipeline:
        rooms = await db.rooms.aggregate(pipeline).to_list(length=10)
    else:
        rooms = await db.rooms.find({"isAvailable": True}).limit(10).to_list(length=10)

    result = []
    for r in rooms:
        result.append({
            "id": str(r.get("_id", "")),
            "roomNumber": r.get("roomNumber", ""),
            "roomType": r.get("roomType", ""),
            "pricePerNight": float(r.get("pricePerNight", 0)),
            "amenities": r.get("amenities", []),
            "hotelName": r.get("hotelName", ""),
            "hotelCity": r.get("hotelCity", ""),
            "reason": "Matches your preferred destinations and travel history",
        })

    return {
        "userId": user_id,
        "recommendations": result,
        "count": len(result),
    }
