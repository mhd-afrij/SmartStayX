// placesRoutes.js — Places, geocoding, and directions routes (Trip Planner + legacy consumers)
import express from "express";
import {
  getAttractions,
  getRestaurants,
  getNearbyPlaces,
  searchPlaces,
  reverseGeocode,
  getDirections,
  geocode,
  getRoute,
} from "../controllers/placesController.js";

const placesRouter = express.Router();

// Legacy endpoints (existing consumers)
placesRouter.get("/attractions", getAttractions);
placesRouter.get("/restaurants", getRestaurants);
placesRouter.get("/geocode", geocode);
placesRouter.get("/route", getRoute);

// Trip Planner endpoints
placesRouter.get("/nearby", getNearbyPlaces);
placesRouter.get("/search", searchPlaces);
placesRouter.get("/reverse-geocode", reverseGeocode);
placesRouter.get("/directions", getDirections);

export default placesRouter;
