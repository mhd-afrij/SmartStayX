// userRoutes.js — User profile, search history, and preferences routes
import express from "express";
import { getUserData, storeRecentSearchedCities, upsertGuestProfile, searchUsers, assignRole, deleteUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

// User API routes.
const userRouter = express.Router();

// GET / — Get the authenticated user's profile data
userRouter.get("/", protect, getUserData);
// POST /store-recent-search — Store a recently searched city (auth required)
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
// PUT /profile — Create or update guest user profile (auth required)
userRouter.put("/profile", protect, upsertGuestProfile);
// GET /search — Search users by email (admin only)
userRouter.get("/search", protect, searchUsers);
// POST /assign-role — Assign a role to a user (admin only)
userRouter.post("/assign-role", protect, assignRole);
// DELETE /:id — Delete a user (admin only)
userRouter.delete("/:id", protect, deleteUser);

export default userRouter;
