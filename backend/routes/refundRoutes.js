// refundRoutes.js — Refund request endpoints: user request/list, owner approve/reject/list
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  requestRefund,
  getUserRefunds,
  listOwnerRefunds,
  approveRefund,
  rejectRefund,
} from "../controllers/refundController.js";

const refundRouter = express.Router();

// User endpoints
refundRouter.post("/request", protect, requestRefund);
refundRouter.get("/user", protect, getUserRefunds);

// Owner endpoints
refundRouter.get("/owner", protect, listOwnerRefunds);
refundRouter.patch("/:refundId/approve", protect, approveRefund);
refundRouter.patch("/:refundId/reject", protect, rejectRefund);

export default refundRouter;
