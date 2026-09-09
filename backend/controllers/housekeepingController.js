// housekeepingController.js — Room cleaning workflow:
// Dirty → Assigned → In-progress → Inspection → Ready
import HousekeepingTask from "../models/HousekeepingTask.js";
import Room from "../models/Room.js";
import { ok, badRequest, notFound, forbidden, created } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notificationHelper.js";

const VALID_TRANSITIONS = {
  dirty: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "dirty"],
  in_progress: ["inspection", "assigned", "dirty"],
  inspection: ["ready", "in_progress"],
  ready: ["dirty"],
};

const setRoomOperationalStatus = async (roomId, status) => {
  await Room.findByIdAndUpdate(roomId, { status, isAvailable: status === "available" });
};

export const createTask = async (req, res) => {
  try {
    const { roomId, room, priority, scheduledFor, checklist } = req.body;
    const roomRef = roomId || room;
    if (!roomRef) return badRequest(res, "roomId is required");

    const hotel = req.scopeHotelId;
    if (!hotel) return forbidden(res, "No hotel assigned");

    const roomDoc = await Room.findById(roomRef);
    if (!roomDoc) return notFound(res, "Room not found");
    if (String(roomDoc.hotel) !== String(hotel)) return forbidden(res, "Not authorized for this hotel");

    const task = await HousekeepingTask.create({
      hotel,
      room: roomDoc._id,
      roomNumber: roomDoc.roomNumber || "",
      priority: priority || "medium",
      scheduledFor: scheduledFor || null,
      createdBy: String(req.user._id),
      checklist: Array.isArray(checklist) && checklist.length
        ? checklist.map((label) => ({ label, completed: false }))
        : [
            { label: "Make bed", completed: false },
            { label: "Replace towels", completed: false },
            { label: "Clean bathroom", completed: false },
            { label: "Vacuum floor", completed: false },
            { label: "Restock amenities", completed: false },
          ],
    });

    // Cleaning status on the room status board
    if (roomDoc.status !== "occupied") {
      await setRoomOperationalStatus(roomDoc._id, "cleaning");
    }

    await createNotification({
      hotel,
      type: "housekeeping",
      title: "Housekeeping Task Created",
      message: `Room ${roomDoc.roomNumber || ""} needs cleaning.`,
      room: roomDoc._id,
    });

    created(res, { message: "Housekeeping task created", task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listTasks = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const { status, assignedTo, page = 1, limit = 50 } = req.query;
    const query = { hotel };
    if (status && status !== "all") query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const [tasks, total] = await Promise.all([
      HousekeepingTask.find(query)
        .populate("room", "roomNumber roomType")
        .populate("assignedTo", "name email image")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      HousekeepingTask.countDocuments(query),
    ]);
    ok(res, { tasks, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, scheduledFor } = req.body;
    if (!assignedTo) return badRequest(res, "assignedTo is required");

    const task = await HousekeepingTask.findById(id);
    if (!task) return notFound(res, "Task not found");
    if (req.user.role !== "super_admin" && String(task.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }

    task.assignedTo = assignedTo;
    task.assignedBy = String(req.user._id);
    if (scheduledFor) task.scheduledFor = new Date(scheduledFor);
    if (task.status === "dirty") task.status = "assigned";
    await task.save();

    ok(res, { message: "Task assigned", task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return badRequest(res, "status is required");

    const task = await HousekeepingTask.findById(id);
    if (!task) return notFound(res, "Task not found");
    if (req.user.role !== "super_admin" && String(task.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }

    if (!VALID_TRANSITIONS[task.status]?.includes(status)) {
      return badRequest(res, `Cannot transition from ${task.status} to ${status}`);
    }

    task.status = status;
    if (status === "in_progress" && !task.startedAt) task.startedAt = new Date();
    if (status === "ready") {
      task.completedAt = new Date();
      // Room back to available on the status board
      await setRoomOperationalStatus(task.room, "available");
    }
    if (status === "dirty") await setRoomOperationalStatus(task.room, "cleaning");
    await task.save();

    ok(res, { message: `Task marked ${status}`, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;
    if (!Array.isArray(checklist)) return badRequest(res, "checklist array is required");

    const task = await HousekeepingTask.findById(id);
    if (!task) return notFound(res, "Task not found");
    if (req.user.role !== "super_admin" && String(task.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    task.checklist = checklist.map((c) => ({ label: c.label || c, completed: !!c.completed }));
    await task.save();
    ok(res, { message: "Checklist updated", task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await HousekeepingTask.findById(id);
    if (!task) return notFound(res, "Task not found");
    if (req.user.role !== "super_admin" && String(task.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    await task.deleteOne();
    ok(res, { message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHousekeepingReport = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");

    const [open, ready, total] = await Promise.all([
      HousekeepingTask.find({ hotel, status: { $in: ["dirty", "assigned", "in_progress", "inspection"] } })
        .populate("assignedTo", "name").lean(),
      HousekeepingTask.countDocuments({ hotel, status: "ready" }),
      HousekeepingTask.countDocuments({ hotel }),
    ]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const completedThisWeek = await HousekeepingTask.countDocuments({
      hotel,
      status: "ready",
      completedAt: { $gte: weekAgo },
    });

    const byStatus = {};
    ["dirty", "assigned", "in_progress", "inspection", "ready"].forEach((s) => {
      byStatus[s] = open.filter((t) => t.status === s).length;
    });

    ok(res, {
      summary: { open: open.length, ready, total, completedThisWeek, byStatus },
      openTasks: open,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};