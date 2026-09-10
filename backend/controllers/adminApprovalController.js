// adminApprovalController.js — Super Admin hotel approval workflow:
// approve / reject / suspend hotels, verify documents, list pending hotels.
import Hotel from "../models/Hotel.js";
import AuditLog from "../models/AuditLog.js";
import { ok, badRequest, notFound } from "../utils/apiResponse.js";

export const getHotelApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status && status !== "all") query.approvalStatus = status;
    const [hotels, total] = await Promise.all([
      Hotel.find(query)
        .select("name city approvalStatus verifiedDocuments documents contact owner createdAt")
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Hotel.countDocuments(query),
    ]);
    ok(res, { hotels, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/hotels/:id/approval — body: { status: approved|rejected|suspended, rejectionReason? }
export const updateHotelApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, verifiedDocuments } = req.body;
    if (!["approved", "rejected", "suspended", "pending"].includes(status)) {
      return badRequest(res, "status must be one of approved, rejected, suspended, pending");
    }
    const hotel = await Hotel.findById(id);
    if (!hotel) return notFound(res, "Hotel not found");

    const oldStatus = hotel.approvalStatus;
    hotel.approvalStatus = status;
    if (status === "rejected" && rejectionReason) hotel.rejectionReason = String(rejectionReason);
    if (status === "approved") {
      hotel.rejectionReason = "";
      hotel.verifiedDocuments = true;
    }
    if (verifiedDocuments !== undefined) hotel.verifiedDocuments = !!verifiedDocuments;
    await hotel.save();

    await AuditLog.create({
      actor: req.user._id,
      action: "hotel_approval",
      module: "hotel",
      recordId: id,
      oldValue: { approvalStatus: oldStatus },
      newValue: { approvalStatus: status, rejectionReason: hotel.rejectionReason },
      ip: req.ip,
      hotelId: hotel._id,
    });

    ok(res, { message: `Hotel ${status}`, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/hotels/:id/documents — verify uploaded documents
export const getHotelDocuments = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select("name documents verifiedDocuments");
    if (!hotel) return notFound(res, "Hotel not found");
    ok(res, { hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};