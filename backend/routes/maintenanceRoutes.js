// maintenanceRoutes.js — Maintenance report routes
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createMaintenanceReport,
  listMaintenanceReports,
  updateMaintenanceReport,
} from '../controllers/maintenanceController.js';

const maintenanceRouter = express.Router();

// POST /api/maintenance/report — Create a maintenance report (owner/receptionist)
maintenanceRouter.post('/report', protect, createMaintenanceReport);

// GET /api/maintenance — List maintenance reports (owner-only, scoped to owned hotels)
maintenanceRouter.get('/', protect, listMaintenanceReports);

// PATCH /api/maintenance/:reportId — Update maintenance report status/assignment
maintenanceRouter.patch('/:reportId', protect, updateMaintenanceReport);

export default maintenanceRouter;
