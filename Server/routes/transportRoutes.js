import express from "express";
import { getRoute } from "../controllers/placesController.js";

const transportRouter = express.Router();

transportRouter.get("/", getRoute);

export default transportRouter;
