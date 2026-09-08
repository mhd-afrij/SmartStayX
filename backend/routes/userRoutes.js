import express from "express";
import { getUserData, storeRecentSearchedCities, upsertGuestProfile, searchUsers, assignRole, deleteUser, getTeam, getTeamActivity } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/authorization.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
userRouter.put("/profile", protect, upsertGuestProfile);
userRouter.get("/search", protect, requireRole("super_admin", "hotel_manager", "receptionist"), searchUsers);
userRouter.post("/assign-role", protect, requireRole("super_admin", "hotel_manager"), assignRole);
userRouter.get("/team", protect, requireRole("super_admin", "hotel_manager"), getTeam);
userRouter.get("/team/activity", protect, requireRole("super_admin", "hotel_manager"), getTeamActivity);
userRouter.delete("/:id", protect, requireRole("super_admin"), deleteUser);

export default userRouter;
