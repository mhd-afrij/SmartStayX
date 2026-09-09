// housekeepingRoutes.js — Housekeeping task routes (manager + super_admin)
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import {
  createTask,
  listTasks,
  assignTask,
  updateTaskStatus,
  updateTaskChecklist,
  deleteTask,
  getHousekeepingReport,
} from "../controllers/housekeepingController.js";

const housekeepingRouter = express.Router();

// Housekeeping assignments/status are manager-scoped. Receptionists may view
// the room status board but don't manage cleaning crews here.
const housekeepingGuard = [requireRole("hotel_manager", "receptionist", "super_admin"), requireHotelScope];

housekeepingRouter.get("/", protect, ...housekeepingGuard, listTasks);
housekeepingRouter.post("/", protect, ...housekeepingGuard, createTask);
housekeepingRouter.get("/report", protect, ...housekeepingGuard, getHousekeepingReport);
housekeepingRouter.patch("/:id/assign", protect, ...housekeepingGuard, assignTask);
housekeepingRouter.patch("/:id/status", protect, ...housekeepingGuard, updateTaskStatus);
housekeepingRouter.patch("/:id/checklist", protect, ...housekeepingGuard, updateTaskChecklist);
housekeepingRouter.delete("/:id", protect, ...housekeepingGuard, deleteTask);

export default housekeepingRouter;