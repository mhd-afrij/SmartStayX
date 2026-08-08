// maintenanceService.js — Business logic for maintenance report workflow
import MaintenanceReport from '../models/MaintenanceReport.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';

// Validate that the room belongs to the hotel
const validateRoomHotel = async (roomId, hotelId) => {
  const room = await Room.findById(roomId).select('roomNumber hotel');
  if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
  if (String(room.hotel) !== String(hotelId)) {
    throw Object.assign(new Error('Room does not belong to this hotel'), { status: 400 });
  }
  return room;
};

// Create a maintenance report
const createReport = async ({ hotel, room, issue, description, priority, reporter }) => {
  const roomDoc = await validateRoomHotel(room, hotel);

  const report = await MaintenanceReport.create({
    hotel,
    room,
    roomNumber: roomDoc.roomNumber || '',
    issue,
    description: description || '',
    priority: priority || 'medium',
    status: 'open',
    reporter,
  });

  return report;
};

// List maintenance reports with filtering and pagination
const listReports = async ({ hotelIds, status, priority, page = 1, limit = 20 }) => {
  const query = {};
  if (hotelIds && hotelIds.length > 0) query.hotel = { $in: hotelIds };
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * l;

  const [reports, total] = await Promise.all([
    MaintenanceReport.find(query)
      .populate('room', 'roomNumber roomType')
      .populate('hotel', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    MaintenanceReport.countDocuments(query),
  ]);

  return { reports, page: p, limit: l, total };
};

// Update a maintenance report status
const updateStatus = async ({ reportId, status, assignedTo, notes, actor }) => {
  const report = await MaintenanceReport.findById(reportId);
  if (!report) throw Object.assign(new Error('Maintenance report not found'), { status: 404 });

  const validTransitions = {
    open: ['in_progress', 'resolved', 'rejected'],
    in_progress: ['resolved', 'rejected', 'open'],
    resolved: ['open', 'in_progress'],
    rejected: ['open'],
  };

  if (status && !validTransitions[report.status]?.includes(status)) {
    throw Object.assign(
      new Error(`Cannot transition from ${report.status} to ${status}`),
      { status: 400 }
    );
  }

  if (status) report.status = status;
  if (assignedTo) report.assignedTo = assignedTo;
  if (notes) {
    const noteStr = typeof notes === 'string' ? notes : JSON.stringify(notes);
    report.notes.push(noteStr);
  }
  if (status === 'resolved') report.resolvedAt = new Date();

  await report.save();
  return report;
};

export default { createReport, listReports, updateStatus };
