from fastapi import APIRouter, Header
from app.models.trip import TripPlannerRequest, TripPlannerResponse, TripItinerary, HotelOption, Activity
from app.database import get_db, is_db_available
from app.config import settings
from typing import Optional
from openai import AsyncOpenAI
import json

router = APIRouter(prefix="/api/trip-planner", tags=["trip-planner"])


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url="https://openrouter.ai/api/v1",
    )


@router.post("", response_model=TripPlannerResponse)
async def plan_trip(
    request: TripPlannerRequest,
    user_id: Optional[str] = Header(None),
):
    if not is_db_available():
        return TripPlannerResponse(
            success=False,
            message="Trip planning is temporarily unavailable because the database cannot be reached.",
        )
    db = get_db()
    client = _get_client()

    hotels_cursor = db.hotels.find({"city": {"$regex": request.destination, "$options": "i"}}).limit(5)
    hotels = await hotels_cursor.to_list(length=5)

    hotel_info = []
    for h in hotels:
        rooms = await db.rooms.find({"hotel": str(h["_id"]), "isAvailable": True}).limit(3).to_list(length=3)
        prices = [float(r.get("pricePerNight", 0)) for r in rooms if r.get("pricePerNight")]
        avg_price = sum(prices) / len(prices) if prices else 0
        hotel_info.append({
            "name": h.get("name", ""),
            "city": h.get("city", ""),
            "description": (h.get("description", "") or "")[:150],
            "avgPricePerNight": round(avg_price, 2),
        })

    activities = await db.activities.find({"category": {"$in": ["excursion", "tour", "wellness", "entertainment"]}}).limit(10).to_list(length=10)
    activity_info = [{"name": a.get("name", ""), "category": a.get("category", ""), "duration": a.get("duration", ""), "price": float(a.get("price", 0))} for a in activities]

    preferences_str = ", ".join(request.preferences) if request.preferences else "General travel"

    prompt = f"""You are a luxury travel planner for SmartStayX. Create a personalized trip itinerary.

DESTINATION: {request.destination}
DATES: {request.checkIn} to {request.checkOut} ({(request.checkOut - request.checkIn).days} nights)
GUESTS: {request.guests}
PREFERENCES: {preferences_str}
BUDGET_PER_NIGHT: {request.budgetPerNight if request.budgetPerNight else "Flexible"}

AVAILABLE HOTELS: {json.dumps(hotel_info, default=str)}
AVAILABLE ACTIVITIES: {json.dumps(activity_info, default=str)}

Generate a JSON response with this exact structure:
{{
  "hotelOptions": [
    {{"name": "Hotel Name", "pricePerNight": 250, "rating": 4.5, "reason": "Why this hotel suits them"}}
  ],
  "dailyPlan": [
    {{"day": 1, "time": "Morning", "title": "Activity Title", "description": "Description", "category": "excursion", "estimatedCost": 50}},
    {{"day": 1, "time": "Afternoon", "title": "Activity Title", "description": "Description", "category": "tour", "estimatedCost": 75}}
  ],
  "totalEstimatedCost": 1500,
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}}

Make recommendations specific to {request.destination} and personalized to the guest's preferences ({preferences_str}).
Only include hotels from the available list above. If none match, suggest based on real knowledge of the area."""

    try:
        response = await client.chat.completions.create(
            model=settings.ai_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)

        days = (request.checkOut - request.checkIn).days
        date_range = f"{request.checkIn} to {request.checkOut} ({days} nights)"

        hotel_options = []
        for ho in parsed.get("hotelOptions", []):
            hotel_options.append(HotelOption(
                name=ho.get("name", "Recommended Hotel"),
                pricePerNight=float(ho.get("pricePerNight", 0)),
                rating=float(ho.get("rating", 4.0)),
                reason=ho.get("reason", "Great choice for your stay"),
            ))

        daily_plan = []
        for act in parsed.get("dailyPlan", []):
            daily_plan.append(Activity(
                day=int(act.get("day", 1)),
                time=act.get("time", "Morning"),
                title=act.get("title", ""),
                description=act.get("description", ""),
                category=act.get("category", "excursion"),
                estimatedCost=float(act["estimatedCost"]) if act.get("estimatedCost") else None,
            ))

        return TripPlannerResponse(
            success=True,
            itinerary=TripItinerary(
                destination=request.destination,
                dateRange=date_range,
                hotelOptions=hotel_options,
                dailyPlan=daily_plan,
                totalEstimatedCost=float(parsed["totalEstimatedCost"]) if parsed.get("totalEstimatedCost") else None,
                tips=parsed.get("tips", []),
            ),
        )
    except Exception as e:
        return TripPlannerResponse(
            success=False,
            message=f"Failed to generate trip plan: {str(e)}",
        )
