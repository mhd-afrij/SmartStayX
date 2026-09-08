// invoiceController.js — Invoice generation and download endpoint
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import invoiceService from "../services/invoiceService.js";

// Authorization guard — the invoice is only visible to the booking's guest,
// the hotel's owner, or a super_admin.
const canAccessInvoice = async (req, bookingId) => {
  if (!bookingId) return { allowed: false, message: "Booking not found" };
  if (req.user?.role === "super_admin") return { allowed: true };

  const booking = await Booking.findById(bookingId).select("user hotel").lean();
  if (!booking) return { allowed: false, message: "Booking not found" };

  // The guest who made the booking
  if (String(booking.user) === String(req.user?._id)) return { allowed: true };

  // The hotel owner
  const hotel = await Hotel.findById(booking.hotel).select("owner").lean();
  if (hotel && String(hotel.owner) === String(req.user?._id)) return { allowed: true };

  // A receptionist assigned to the hotel
  if (req.user?.assignedHotel && String(req.user.assignedHotel) === String(booking.hotel)) {
    return { allowed: true };
  }

  return { allowed: false, message: "Not authorized to view this invoice" };
};

export const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const access = await canAccessInvoice(req, bookingId);
    if (!access.allowed) return res.json({ success: false, message: access.message });

    const invoiceData = await invoiceService.generateInvoice(bookingId);
    const html = invoiceService.generateHtmlInvoice(invoiceData);

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceData.invoiceNumber}.html"`);
    res.send(html);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const viewInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const access = await canAccessInvoice(req, bookingId);
    if (!access.allowed) return res.json({ success: false, message: access.message });

    const invoiceData = await invoiceService.generateInvoice(bookingId);
    const html = invoiceService.generateHtmlInvoice(invoiceData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getInvoiceData = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const access = await canAccessInvoice(req, bookingId);
    if (!access.allowed) return res.json({ success: false, message: access.message });

    const invoiceData = await invoiceService.generateInvoice(bookingId);
    res.json({ success: true, invoice: invoiceData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    // Platform-wide reports are a super_admin capability.
    if (req.user?.role !== "super_admin") {
      return res.json({ success: false, message: "Not authorized to export reports" });
    }
    const { type, format = "csv" } = req.query;
    let data;
    if (type === "bookings") {
      data = await Booking.find()
        .populate("room", "roomNumber")
        .populate("hotel", "name")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      return res.json({ success: false, message: "Unsupported report type" });
    }

    const csv = invoiceService.generateCsvReport(data, type);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-report-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
