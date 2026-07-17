from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class TripPlannerRequest(BaseModel):
    destination: str
    checkIn: date
    checkOut: date
    guests: int = 2
    preferences: Optional[List[str]] = None
    budgetPerNight: Optional[float] = None


class Activity(BaseModel):
    day: int
    time: str
    title: str
    description: str
    category: str
    estimatedCost: Optional[float] = None


class HotelOption(BaseModel):
    name: str
    pricePerNight: float
    rating: float
    reason: str


class TripItinerary(BaseModel):
    destination: str
    dateRange: str
    hotelOptions: List[HotelOption]
    dailyPlan: List[Activity]
    totalEstimatedCost: Optional[float] = None
    tips: List[str]


class TripPlannerResponse(BaseModel):
    success: bool
    itinerary: Optional[TripItinerary] = None
    message: Optional[str] = None
