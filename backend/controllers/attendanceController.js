// attendanceController.js — Staff attendance (time-based check-in/check-out)
// and leave request management. Hotel-scoped for managers/attendees.
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { ok, badRequest, notFound, forbidden, created } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notificationHelper.js";

const toDateKey = (d) => new Date(d).toISOString().split("T")[0];

// Parses expected shift start/end "HH:MM" against a date.
const parseShiftTime = (date, hhmm, fallbackHour = 9) => {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(String(hhmm))) {
    const d = new Date(date);
    d.setHours(fallbackHour, 0, 0, 0);
    return d;
  }
  const [h, m] = String(hhmm).split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m || 0, 0, 0);
  return d;
};

const deriveStatus = (attendance, expectedStart) => {
  if (attendance.status === "leave") return "leave";
  if (!attendance.checkInTime) return "absent";
  const lateMs = expectedStart ? attendance.checkInTime - new Date(expectedStart) : 0;
  const lateMinutes = lateMs > 0 ? Math.round(lateMs / 60000) : 0;
  if (lateMinutes > 0) {
    return lateMinutes <= 60 ? "late" : "half_day";
  }
  return "present";
};

// POST /api/attendance/check-in — self check-in (or manager for a staff member)
export const checkIn = async (req, res) => {
  try {
    const { hotelId, staff: staffId, shiftStart, latitude, longitude } = req.body;
    const hotel = req.scopeHotelId || hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");

    const userId = String(req.user._id);
    const staff = staffId && String(staffId) !== userId ? String(staffId) : userId;
    const date = new Date();
    const dateKey = toDateKey(date);

    let record = await Attendance.findOne({ staff, hotel, date }).catch(() => null);
    if (!record) {
      record = await Attendance.create({
        staff,
        hotel,
        date,
        shiftStart: parseShiftTime(date, shiftStart),
        status: "present",
        source: req.body.source || "manual",
      });
    }
    if (record.checkInTime) return badRequest(res, "Already checked in today");

    record.checkInTime = date;
    if (typeof latitude === "number" && typeof longitude === "number") {
      record.location = { type: "Point", coordinates: [longitude, latitude] };
    }
    record.status = "present";
    await record.save();

    ok(res, { message: "Checked in", attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/attendance/check-out
export const checkOut = async (req, res) => {
  try {
    const { hotelId, staff: staffId } = req.body;
    const hotel = req.scopeHotelId || hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");

    const userId = String(req.user._id);
    const staff = staffId && String(staffId) !== userId ? String(staffId) : userId;
    const dateKeyStart = new Date(); dateKeyStart.setHours(0, 0, 0, 0);
    const dateKeyEnd = new Date(dateKeyStart); dateKeyEnd.setDate(dateKeyStart.getDate() + 1);

    const record = await Attendance.findOne({ staff, hotel, date: { $gte: dateKeyStart, $lt: dateKeyEnd } });
    if (!record) return notFound(res, "No active check-in found for today");
    if (record.checkOutTime) return badRequest(res, "Already checked out today");

    record.checkOutTime = new Date();
    record.status = deriveStatus(record, record.shiftStart);
    await record.save();

    ok(res, { message: "Checked out", attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/my?hotelId= — staff member's own records
export const getMyAttendance = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const { from, to } = req.query;
    const query = { staff: String(req.user._id), hotel };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const records = await Attendance.find(query).sort({ date: -1 }).limit(120);
    ok(res, { attendance: records.map((r) => ({
      ...r.toObject(),
      status: deriveStatus(r, r.shiftStart),
    })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance?hotelId=&from=&to=&staff= — manager view
export const listAttendance = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const { from, to, staff, page = 1, limit = 20 } = req.query;
    const query = { hotel };
    if (staff) query.staff = staff;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate("staff", "name email image")
        .sort({ date: -1, staff: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Attendance.countDocuments(query),
    ]);
    ok(res, {
      attendance: records.map((r) => ({ ...r.toObject(), status: deriveStatus(r, r.shiftStart) })),
      total,
      page: Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/report?hotelId=&month=YYYY-MM — monthly summary
export const getMonthlyReport = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const from = new Date(`${month}-01T00:00:00.000Z`);
    const to = new Date(from); to.setMonth(from.getMonth() + 1);

    const records = await Attendance.find({ hotel, date: { $gte: from, $lt: to } })
      .populate("staff", "name email image")
      .sort({ staff: 1, date: 1 });

    const staffMap = new Map();
    for (const r of records) {
      const key = String(r.staff._id);
      const entry = staffMap.get(key) || {
        staff: r.staff,
        present: 0, late: 0, absent: 0, half_day: 0, leave: 0,
        totalMinutes: 0, days: 0,
      };
      const status = deriveStatus(r, r.shiftStart);
      entry[status] += 1;
      if (r.checkInTime && r.checkOutTime) {
        entry.totalMinutes += Math.round((r.checkOutTime - r.checkInTime) / 60000);
      }
      entry.days += 1;
      staffMap.set(key, entry);
    }

    const leaveDays = await LeaveRequest.countDocuments({
      hotel,
      startDate: { $lt: to },
      endDate: { $gte: from },
      status: "approved",
    });

    ok(res, {
      month,
      totalLeaveDays: leaveDays,
      staffSummaries: [...staffMap.values()].map((s) => ({
        ...s,
        avgHours: s.days ? +(s.totalMinutes / 60 / s.days).toFixed(1) : 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Leave requests ────────────────────────────────────────────────────────

export const requestLeave = async (req, res) => {
  try {
    const { hotelId, type, startDate, endDate, reason } = req.body;
    const hotel = req.scopeHotelId || hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    if (!type || !startDate || !endDate) return badRequest(res, "type, startDate, and endDate are required");

    const start = new Date(startDate); const end = new Date(endDate);
    if (end < start) return badRequest(res, "endDate must be after startDate");
    const days = Math.max(0.5, Math.round((end - start) / (24 * 60 * 60 * 1000) + 1));

    const leave = await LeaveRequest.create({
      staff: String(req.user._id),
      hotel,
      type,
      startDate: start,
      endDate: end,
      days,
      reason: reason || "",
    });

    await createNotification({
      hotel,
      type: "leave",
      title: "Leave Requested",
      message: `Leave request submitted (${days} day${days > 1 ? "s" : ""}).`,
    });

    created(res, { leave, days });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listLeaveRequests = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const { status, page = 1, limit = 20 } = req.query;
    const query = { hotel };
    if (status) query.status = status;

    const [leaves, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate("staff", "name email image")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      LeaveRequest.countDocuments(query),
    ]);
    ok(res, { leaves, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const respondLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return badRequest(res, "status must be approved or rejected");
    }
    const leave = await LeaveRequest.findById(id);
    if (!leave) return notFound(res, "Leave request not found");

    const hotel = req.scopeHotelId || req.body.hotelId;
    if (req.user.role !== "super_admin" && String(leave.hotel) !== String(hotel || "")) {
      return forbidden(res, "Not authorized for this hotel");
    }

    leave.status = status;
    leave.approvedBy = String(req.user._id);
    leave.responseNote = note || leave.responseNote || "";
    leave.respondedAt = new Date();
    await leave.save();

    await createNotification({
      hotel: leave.hotel,
      type: "leave",
      title: `Leave ${status}`,
      message: `Your leave request has been ${status}.`,
    });

    ok(res, { message: `Leave request ${status}`, leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};