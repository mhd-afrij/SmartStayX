// placesRoutes.js — Nearby places, attractions, and geocoding routes
import express from "express";
import { getAttractions, getRestaurants, geocode } from "../controllers/placesController.js";

const placesRouter = express.Router();

placesRouter.get("/attractions", getAttractions);
placesRouter.get("/restaurants", getRestaurants);
placesRouter.get("/geocode", geocode);

export default placesRouter;
