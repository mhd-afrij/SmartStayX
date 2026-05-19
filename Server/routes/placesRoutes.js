import express from "express";
import { getAttractions, getRestaurants } from "../controllers/placesController.js";

const placesRouter = express.Router();

placesRouter.get("/attractions", getAttractions);
placesRouter.get("/restaurants", getRestaurants);

export default placesRouter;
