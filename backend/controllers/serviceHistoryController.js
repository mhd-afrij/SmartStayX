// serviceHistoryController.js — Guest-facing service request history
import ServiceRequest from "../models/ServiceRequest.js";

export const getMyServiceRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { guest: userId };
    if (status && ["pending", "assigned", "completed", "cancelled"].includes(status)) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      ServiceRequest.find(query)
        .populate("room", "roomNumber roomType")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      ServiceRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      requests: requests.map((r) => ({
        _id: r._id,
        serviceType: r.serviceType,
        requestDetails: r.requestDetails,
        status: r.status,
        roomNumber: r.roomNumber,
        staffAssigned: null,
        staffRole: null,
        requestedAt: r.requestedAt || r.createdAt,
        completedAt: r.completedAt,
        delayMinutes: r.delayMinutes,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    res.json({ success: false, message: error.message, requests: [], total: 0 });
  }
};

export const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findOne({ _id: id, guest: req.user._id })
      .populate("room", "roomNumber roomType")
      .lean();

    if (!request) return res.json({ success: false, message: "Service request not found" });

    res.json({ success: true, request });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
