// maintenanceRoutes.js — Maintenance report routes
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/authorization.js';
import {
  createMaintenanceReport,
  listMaintenanceReports,
  updateMaintenanceReport,
} from '../controllers/maintenanceController.js';

const maintenanceRouter = express.Router();

// POST /api/maintenance/report — Create a maintenance report (manager/receptionist/super-admin)
maintenanceRouter.post('/report', protect, requireRole('hotel_manager', 'receptionist', 'super_admin'), createMaintenanceReport);

// GET /api/maintenance — List maintenance reports (manager-only, scoped to owned hotels)
maintenanceRouter.get('/', protect, requireRole('hotel_manager', 'super_admin'), listMaintenanceReports);

// PATCH /api/maintenance/:reportId — Update maintenance report status/assignment
maintenanceRouter.patch('/:reportId', protect, requireRole('hotel_manager', 'super_admin'), updateMaintenanceReport);

export default maintenanceRouter;
