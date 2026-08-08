// maintenanceController.js — Maintenance report handling: create, list, update status
import maintenanceService from '../services/maintenanceService.js';
import Hotel from '../models/Hotel.js';
import { ok, badRequest, notFound, serverError, forbidden } from '../utils/apiResponse.js';

// Create a maintenance report (owner/receptionist)
export const createMaintenanceReport = async (req, res, next) => {
  try {
    const { hotel, room, roomId, hotelId, issue, description, priority } = req.body;
    const reporter = req.user?._id || req.user?.id;

    // Accept both `hotel`/`room` and `hotelId`/`roomId` field names
    const hotelRef = hotel || hotelId;
    const roomRef = room || roomId;

    if (!hotelRef || !roomRef || !issue) {
      return badRequest(res, 'hotel, room, and issue are required');
    }

    const report = await maintenanceService.createReport({
      hotel: hotelRef,
      room: roomRef,
      issue,
      description,
      priority,
      reporter,
    });

    ok(res, { message: 'Maintenance report created', report }, 201);
  } catch (error) {
    if (error.status === 404) return notFound(res, error.message);
    if (error.status === 400) return badRequest(res, error.message);
    next(error);
  }
};

// List maintenance reports scoped to the owner's hotels
export const listMaintenanceReports = async (req, res, next) => {
  try {
    const ownerId = req.user?._id || req.user?.id;
    const { status, priority, page, limit, hotelId } = req.query;

    const ownedHotels = await Hotel.find({ owner: ownerId }).select('_id');
    const ownedHotelIds = ownedHotels.map((h) => h._id);

    let hotelIds = ownedHotelIds;
    if (hotelId && hotelId !== 'all') {
      const isOwned = ownedHotelIds.some((id) => String(id) === String(hotelId));
      if (!isOwned) return forbidden(res, 'Not authorized for this hotel');
      hotelIds = [hotelId];
    }

    const result = await maintenanceService.listReports({
      hotelIds,
      status,
      priority,
      page,
      limit,
    });

    ok(res, result);
  } catch (error) {
    next(error);
  }
};

// Update maintenance report status / assignment
export const updateMaintenanceReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, assignedTo, notes } = req.body;
    const actor = req.user?._id || req.user?.id;

    const report = await maintenanceService.updateStatus({
      reportId,
      status,
      assignedTo,
      notes,
      actor,
    });

    ok(res, { message: 'Maintenance report updated', report });
  } catch (error) {
    if (error.status === 404) return notFound(res, error.message);
    if (error.status === 400) return badRequest(res, error.message);
    next(error);
  }
};

