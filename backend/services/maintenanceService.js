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
    status: 'reported',
    reporter,
    statusHistory: [{ from: null, to: 'reported', at: new Date(), actor: reporter }],
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

// Fetch a single report (used by controllers for scope checks)
const getReport = async (reportId) => {
  return MaintenanceReport.findById(reportId).select('hotel status').lean();
};

// Valid transition map covering both the modern workflow and legacy statuses.
const validTransitions = {
  // Modern workflow
  reported: ['assigned', 'repairing', 'completed', 'rejected'],
  assigned: ['repairing', 'completed', 'rejected', 'reported'],
  repairing: ['completed', 'rejected', 'assigned'],
  completed: ['verified', 'repairing', 'rejected'],
  verified: ['repairing'],
  rejected: ['reported', 'assigned'],
  // Legacy statuses kept working
  open: ['in_progress', 'resolved', 'rejected', 'assigned'],
  in_progress: ['resolved', 'rejected', 'open', 'repairing'],
  resolved: ['open', 'in_progress', 'verified'],
};

// Map a legacy status onto the modern workflow for timestamp purposes.
const stageTime = {
  assigned: 'assignedAt',
  repairing: 'repairingStartedAt',
  completed: 'completedAt',
  verified: 'verifiedAt',
  resolved: 'resolvedAt',
};

// Update a maintenance report status
const updateStatus = async ({ reportId, status, assignedTo, notes, actor }) => {
  const report = await MaintenanceReport.findById(reportId);
  if (!report) throw Object.assign(new Error('Maintenance report not found'), { status: 404 });

  if (status && !validTransitions[report.status]?.includes(status)) {
    throw Object.assign(
      new Error(`Cannot transition from ${report.status} to ${status}`),
      { status: 400 }
    );
  }

  if (status && status !== report.status) {
    report.statusHistory.push({ from: report.status, to: status, at: new Date(), actor });
    const timeField = stageTime[status];
    if (timeField) report[timeField] = new Date();
    report.status = status;
  }
  if (assignedTo) {
    report.assignedTo = assignedTo;
    if (report.status === 'reported') report.status = 'assigned';
  }
  if (notes) {
    const noteStr = typeof notes === 'string' ? notes : JSON.stringify(notes);
    report.notes.push(noteStr);
  }
  if (status === 'resolved' || status === 'completed') report.resolvedAt = new Date();

  await report.save();
  return report;
};

export default { createReport, listReports, updateStatus, getReport };