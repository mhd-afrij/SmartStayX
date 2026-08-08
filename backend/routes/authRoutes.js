import express from "express";
import { me } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.get("/me", protect, me);

export default authRouter;
