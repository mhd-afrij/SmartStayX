// attendanceRoutes.js — Staff attendance + leave request routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  listAttendance,
  getMonthlyReport,
  requestLeave,
  listLeaveRequests,
  respondLeaveRequest,
} from "../controllers/attendanceController.js";

const attendanceRouter = express.Router();

// All attendance routes require an authenticated hotel-scoped staff member.
// hotel_manager and super_admin see the full hotel roster; receptionists are
// denied (staff management is manager-only).
const managerGuard = [requireRole("hotel_manager", "super_admin"), requireHotelScope];
const staffGuard = [requireRole("hotel_manager", "receptionist", "super_admin"), requireHotelScope];

// Self check-in/check-out
attendanceRouter.post("/check-in", protect, ...staffGuard, checkIn);
attendanceRouter.post("/check-out", protect, ...staffGuard, checkOut);

// My records
attendanceRouter.get("/my", protect, ...staffGuard, getMyAttendance);

// Manager dashboard
attendanceRouter.get("/report", protect, ...managerGuard, getMonthlyReport);
attendanceRouter.get("/", protect, ...managerGuard, listAttendance);

// Leave requests
attendanceRouter.post("/leave", protect, ...staffGuard, requestLeave);
attendanceRouter.get("/leave", protect, ...managerGuard, listLeaveRequests);
attendanceRouter.patch("/leave/:id", protect, ...managerGuard, respondLeaveRequest);

export default attendanceRouter;