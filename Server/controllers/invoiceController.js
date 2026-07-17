// invoiceController.js — Invoice generation and download endpoint
import Booking from "../models/Booking.js";
import invoiceService from "../services/invoiceService.js";

export const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
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
    const invoiceData = await invoiceService.generateInvoice(bookingId);
    res.json({ success: true, invoice: invoiceData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const exportReport = async (req, res) => {
  try {
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
