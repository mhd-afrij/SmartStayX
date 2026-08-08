import express from "express";
import { getUserData, storeRecentSearchedCities, upsertGuestProfile, searchUsers, assignRole, deleteUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireStaff, requireRole } from "../middleware/authorization.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
userRouter.put("/profile", protect, upsertGuestProfile);
userRouter.get("/search", protect, requireStaff, searchUsers);
userRouter.post("/assign-role", protect, requireRole("owner", "admin"), assignRole);
userRouter.delete("/:id", protect, requireRole("owner", "admin"), deleteUser);

export default userRouter;
