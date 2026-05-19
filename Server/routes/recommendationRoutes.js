import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserRecommendations } from "../controllers/recommendationController.js";

const recommendationRouter = express.Router();

recommendationRouter.get("/user", protect, getUserRecommendations);

export default recommendationRouter;
