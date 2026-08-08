// serviceHistoryRoutes.js — Guest-facing service request history routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyServiceRequests, getServiceRequestById } from "../controllers/serviceHistoryController.js";

const serviceHistoryRouter = express.Router();

serviceHistoryRouter.get("/", protect, getMyServiceRequests);
serviceHistoryRouter.get("/:id", protect, getServiceRequestById);

export default serviceHistoryRouter;
