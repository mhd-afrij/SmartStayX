// roomAssignmentRoutes.js — Auto room assignment by preferences routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getBestRoom, autoAssignRoom } from "../controllers/roomAssignmentController.js";

const roomAssignmentRouter = express.Router();

roomAssignmentRouter.get("/best-room", protect, getBestRoom);
roomAssignmentRouter.post("/assign", protect, autoAssignRoom);

export default roomAssignmentRouter;
