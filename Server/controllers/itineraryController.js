import axios from 'axios';
import { getAttractions, getRestaurants, geocode, getRoute } from './placesController.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const collectJson = async (handler, req) => {
  let payload = null;
  await handler(req, {
    json(data) {
      payload = data;
      return data;
    },
  });
  return payload;
};

export const getItineraryPreview = async (req, res) => {
  const destination = String(req.query.destination || req.query.city || '').trim();
  const hotel = String(req.query.hotel || '').trim();
  const checkIn = String(req.query.checkIn || '').trim();
  const checkOut = String(req.query.checkOut || '').trim();
  const guests = Number(req.query.guests || 2) || 2;
  const preferences = String(req.query.preferences || '').split(',').map((item) => item.trim()).filter(Boolean);
  const budgetPerNight = req.query.budgetPerNight ? Number(req.query.budgetPerNight) : undefined;

  if (!destination && !hotel) {
    return res.json({ success: false, message: 'destination or hotel is required' });
  }

  let aiPayload = null;
  if (destination && checkIn && checkOut) {
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/trip-planner`, {
        destination,
        checkIn,
        checkOut,
        guests,
        preferences,
        budgetPerNight,
      }, { timeout: 10000 });
      aiPayload = aiResponse.data || null;
    } catch {
      aiPayload = null;
    }
  }

  const geocodeReq = { query: { place: destination || hotel } };
  const geoPayload = await collectJson(geocode, geocodeReq);

  const coordQuery = geoPayload?.success && geoPayload.location
    ? { lat: geoPayload.location.lat, lng: geoPayload.location.lng }
    : { destination: destination || hotel };

  const attractionsPayload = await collectJson(getAttractions, { query: coordQuery });
  const restaurantsPayload = await collectJson(getRestaurants, { query: coordQuery });

  const routeTarget = attractionsPayload?.attractions?.[0]?.address || restaurantsPayload?.restaurants?.[0]?.address || '';
  const routePayload = routeTarget && geoPayload?.success && geoPayload.location
    ? await collectJson(getRoute, {
        query: {
          origin: `${geoPayload.location.lat},${geoPayload.location.lng}`,
          destination: routeTarget,
        },
      })
    : null;

  const itinerary = {
    destination: destination || hotel,
    hotel: hotel || null,
    mapCenter: geoPayload?.location || null,
    aiPlan: aiPayload?.success ? aiPayload.itinerary : null,
    attractions: attractionsPayload?.attractions || [],
    restaurants: restaurantsPayload?.restaurants || [],
    route: routePayload?.route || null,
    tripPlan: aiPayload?.success ? aiPayload.itinerary : {
      destination: destination || hotel,
      dateRange: checkIn && checkOut ? `${checkIn} to ${checkOut}` : '',
      hotelOptions: [],
      dailyPlan: [],
      totalEstimatedCost: null,
      tips: [],
    },
  };

  res.json({ success: true, itinerary });
};

export default { getItineraryPreview };
