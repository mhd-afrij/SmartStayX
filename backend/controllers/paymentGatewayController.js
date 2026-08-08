// paymentGatewayController.js — Multi-gateway payment processing and gateway listing
import paymentGatewayService from "../services/paymentGatewayService.js";
import Booking from "../models/Booking.js";

export const getAvailableGateways = async (req, res) => {
  try {
    const gateways = paymentGatewayService.getAvailableGateways();
    res.json({ success: true, gateways });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { bookingId, method } = req.body;
    if (!bookingId || !method) {
      return res.json({ success: false, message: "bookingId and method are required" });
    }

    const booking = await Booking.findById(bookingId).populate("hotel");
    if (!booking) return res.json({ success: false, message: "Booking not found" });

    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:5173";
    const result = await paymentGatewayService.processPayment({ method, booking, frontendUrl });

    if (method === "pay_at_hotel") {
      booking.paymentMethod = "Pay At Hotel";
      booking.isPaid = false;
      await booking.save();
    }

    res.json({ success: true, ...result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await paymentGatewayService.capturePayPalOrder(orderId);
    res.json({ success: result.status === "COMPLETED", capture: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
