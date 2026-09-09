// adminReportsController.js — Super Admin platform reports: revenue,
// bookings, hotel performance ranking.
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Refund from "../models/Refund.js";
import PlatformSettings from "../models/PlatformSettings.js";
import { ok } from "../utils/apiResponse.js";

const { CHECKED_OUT, CONFIRMED, CHECKED_IN, CANCELLED, EXPIRED } = {
  CHECKED_OUT: "checked_out",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

export const getRevenueReport = async (req, res) => {
  try {
    const { range = "30d", granularity } = req.query;
    const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "year" ? 365 : 30;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({ createdAt: { $gte: start }, status: { $nin: [CANCELLED, EXPIRED] } })
      .select("createdAt totalPrice hotel status")
      .lean();

    const totalRevenue = bookings.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
    const byDay = {};
    const gran = granularity || (days <= 31 ? "day" : "month");
    bookings.forEach((b) => {
      const d = new Date(b.createdAt);
      const key = gran === "month" ? d.toISOString().slice(0, 7) : d.toISOString().split("T")[0];
      byDay[key] = (byDay[key] || 0) + (Number(b.totalPrice) || 0);
    });

    const platform = await PlatformSettings.getSettings();
    const commission = (Number(totalRevenue) * (platform?.commissionRate ?? 10)) / 100;

    ok(res, {
      report: {
        range: days,
        totalRevenue: Math.round(totalRevenue),
        commissionRate: platform?.commissionRate ?? 10,
        platformCommission: Math.round(commission),
        bookingCount: bookings.length,
        breakdown: Object.entries(byDay).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelPerformanceReport = async (req, res) => {
  try {
    const hotels = await Hotel.find().select("_id name city approvalStatus").lean();
    const bookings = await Booking.find({ status: { $nin: [CANCELLED, EXPIRED] } })
      .select("hotel totalPrice status")
      .lean();

    const byHotel = {};
    bookings.forEach((b) => {
      const k = String(b.hotel);
      byHotel[k] = byHotel[k] || { bookings: 0, revenue: 0, completed: 0 };
      byHotel[k].bookings += 1;
      byHotel[k].revenue += Number(b.totalPrice) || 0;
      if (b.status === CHECKED_OUT) byHotel[k].completed += 1;
    });

    const rows = hotels.map((h) => {
      const s = byHotel[String(h._id)] || { bookings: 0, revenue: 0, completed: 0 };
      return {
        hotel: h,
        bookings: s.bookings,
        revenue: Math.round(s.revenue),
        completed: s.completed,
        conversion: s.bookings ? Math.round((s.completed / s.bookings) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    ok(res, { report: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentsReport = async (req, res) => {
  try {
    const { page = 1, limit = 20, paid } = req.query;
    const query = {};
    if (paid === "true") query.isPaid = true;
    if (paid === "false") query.isPaid = false;
    const [bookings, total, refunds] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("hotel", "name city"),
      Booking.countDocuments(query),
      Refund.find({ status: { $in: ["approved", "processed"] } }).select("amount booking"),
    ]);

    const totalRefunded = refunds.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    ok(res, {
      payments: bookings.map((b) => ({
        _id: b._id,
        guestDisplayName: b.guestDisplayName,
        amount: b.totalPrice,
        paymentMethod: b.paymentMethod,
        isPaid: b.isPaid,
        status: b.status,
        createdAt: b.createdAt,
        hotel: b.hotel,
        stripePaymentIntentId: b.stripePaymentIntentId,
      })),
      refunds: { count: refunds.length, totalAmount: totalRefunded },
      total,
      page: Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};