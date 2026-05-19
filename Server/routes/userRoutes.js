import express from "express";
import { getUserData, storeRecentSearchedCities, upsertGuestProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

// User API routes.
const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
userRouter.put("/profile", protect, upsertGuestProfile);

export default userRouter;
