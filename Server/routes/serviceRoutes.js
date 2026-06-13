// serviceRoutes.js — Room service request handling routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  requestService,
  updateServiceStatus,
  getHotelServiceHistory,
  addStaff,
  getStaffList,
  updateStaff,
  deleteStaff,
  toggleStaffAvailability,
  getServiceStats,
} from "../controllers/serviceController.js";

const serviceRouter = express.Router();

serviceRouter.post("/request", protect, requestService);
serviceRouter.post("/update-status", protect, updateServiceStatus);
serviceRouter.get("/history", protect, getHotelServiceHistory);
serviceRouter.post("/add-staff", protect, addStaff);
serviceRouter.get("/staff", protect, getStaffList);
serviceRouter.put("/staff/:id", protect, updateStaff);
serviceRouter.delete("/staff/:id", protect, deleteStaff);
serviceRouter.patch("/staff/:id/toggle-availability", protect, toggleStaffAvailability);
serviceRouter.get("/stats", protect, getServiceStats);

export default serviceRouter;
